import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { checkPaymentDeposit } from "@/lib/binance";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, txHash, clientFailCount } = body;

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const db = await getDb();
    const payment = await db.collection("crypto_payments").findOne({ order_id: orderId });

    if (!payment) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (payment.status === "completed" || payment.status === "paid") {
      return NextResponse.json({
        success: true,
        verified: true,
        status: "completed",
        paymentStatus: payment.payment_status || "exact",
        actualAmount: payment.actual_amount ?? payment.amount,
        expectedAmount: payment.expected_amount ?? payment.amount,
        difference: payment.amount_difference ?? 0,
        message: "تم تأكيد الدفع مسبقاً بنجاح لهذا الطلب!",
        payment,
      });
    }

    // underpaid payments should surface their stored details too
    if (payment.status === "underpaid") {
      return NextResponse.json({
        success: true,
        verified: false,
        status: "underpaid",
        paymentStatus: "underpaid",
        actualAmount: payment.actual_amount,
        expectedAmount: payment.expected_amount ?? payment.amount,
        difference: payment.amount_difference,
        message: `المبلغ المحول (${payment.actual_amount} USDT) أقل من المطلوب (${payment.expected_amount ?? payment.amount} USDT). يرجى إكمال المبلغ المتبقي.`,
        payment,
      });
    }

    // If user failed before, check if they are still within the 60-second cooldown:
    if ((payment.failed_attempts || 0) > 0 && payment.last_attempt_at) {
      const elapsedMs = Date.now() - new Date(payment.last_attempt_at).getTime();
      const cooldownMs = 60 * 1000;
      if (elapsedMs < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - elapsedMs) / 1000);
        return NextResponse.json({
          success: true,
          verified: false,
          status: (payment.failed_attempts || 0) >= 2 ? "failed_exhausted" : "retry_cooldown",
          attemptsLeft: (payment.failed_attempts || 0) >= 2 ? 0 : 1,
          retryAfterSeconds: remainingSeconds,
          message: `يرجى الانتظار ${remainingSeconds} ثانية قبل المحاولة مرة أخرى.`,
        });
      } else if ((payment.failed_attempts || 0) >= 2) {
        // After 60s cooldown expires on 2nd attempt, reset failed attempts so user can retry payment freely:
        await db.collection("crypto_payments").updateOne(
          { order_id: orderId },
          { $set: { failed_attempts: 0, status: "pending" } }
        );
        payment.failed_attempts = 0;
      }
    }

    const activeTx = (txHash || payment.tx_hash || "").trim();

    // TEST MODE: Entering "1" as the TxID/transaction input immediately approves the payment
    const isTestBypass = activeTx === "1";

    // Strict duplicate check: If a txHash is submitted, ensure it wasn't already successfully claimed/verified by another order
    if (activeTx && !isTestBypass) {
      const clean = activeTx.toLowerCase();
      const cleanWithout0x = clean.replace(/^0x/, "");
      const duplicateOrder = await db.collection("crypto_payments").findOne({
        order_id: { $ne: orderId },
        status: { $in: ["completed", "paid", "underpaid"] },
        $or: [
          { tx_hash: { $regex: new RegExp(`^${clean}$`, "i") } },
          { tx_hash: { $regex: new RegExp(`^0x${cleanWithout0x}$`, "i") } },
          { tx_hash: { $regex: new RegExp(`^${cleanWithout0x}$`, "i") } },
        ],
      });

      if (duplicateOrder) {
        return NextResponse.json({
          success: true,
          verified: false,
          status: "duplicate",
          message: "رمز المعاملة (TxID) هذا تم استخدامه وتأكيده مسبقاً في طلب آخر ولا يمكن استخدامه مجدداً.",
        });
      }
    }

    // Retrieve all previously verified hashes and deposit IDs across all orders to prevent any reuse
    const allUsedPayments = await db
      .collection("crypto_payments")
      .find({
        order_id: { $ne: orderId },
        status: { $in: ["completed", "paid", "underpaid"] },
        $or: [
          { tx_hash: { $exists: true, $ne: "" } },
          { binance_order_id: { $exists: true, $ne: "" } },
        ],
      })
      .project({ tx_hash: 1, binance_order_id: 1 })
      .toArray();

    const usedTxHashes = allUsedPayments
      .map((p) => p.tx_hash)
      .filter((h) => h && h !== "1") as string[];
    const usedDepositIds = allUsedPayments
      .map((p) => p.binance_order_id)
      .filter(Boolean) as string[];

    const createdAtTimestamp = new Date(payment.created_at).getTime();

    // Get expected amount from DB (not from frontend)
    const expectedAmount = Number(payment.amount);

    // Call Binance live verification or use test bypass if 1 was entered
    let verification: any;
    if (isTestBypass) {
      const mockDeposit = {
        id: `TEST_DEPOSIT_${Date.now()}`,
        txId: "1",
        amount: expectedAmount.toString(),
        coin: payment.currency || "USDT",
        network: payment.network || "BINANCE_PAY",
        status: 1,
        completeTime: Date.now(),
      };
      verification = {
        verified: true,
        paymentStatus: "exact",
        deposit: mockDeposit,
        actualAmount: expectedAmount,
        expectedAmount,
        difference: 0,
        matchType: "test_bypass",
      };
    } else {
      verification = await checkPaymentDeposit({
        expectedAmount,
        coin: payment.currency || "USDT",
        txHash: txHash || payment.tx_hash,
        createdAtTimestamp,
        usedTxHashes,
        usedDepositIds,
      });
    }

    const deposit = (verification as any).deposit;
    const paymentStatus: string = (verification as any).paymentStatus || "";
    const actualAmount: number | undefined = (verification as any).actualAmount;
    const difference: number = (verification as any).difference ?? 0;

    // ─── UNDERPAID: TX found but paid less ───────────────────────────────────
    if (!verification.verified && paymentStatus === "underpaid" && deposit) {
      const finalTxHash = deposit.txId || txHash || payment.tx_hash || "";

      const resolvedNetwork = deposit?.network || payment.network || (finalTxHash.startsWith("0x") ? "BSC" : "TRC20");

      await db.collection("crypto_payments").updateOne(
        { order_id: orderId },
        {
          $set: {
            status: "underpaid",
            payment_status: "underpaid",
            tx_hash: finalTxHash,
            network: resolvedNetwork,
            actual_amount: actualAmount,
            expected_amount: expectedAmount,
            amount_difference: difference,
            refund_required: false,
            verified_at: new Date(),
            metadata: JSON.stringify({ depositDetails: deposit, matchType: (verification as any).matchType }),
          },
        }
      );

      return NextResponse.json({
        success: true,
        verified: false,
        status: "underpaid",
        paymentStatus: "underpaid",
        actualAmount,
        expectedAmount,
        difference,
        txHash: finalTxHash,
        message: `المبلغ المحول (${actualAmount} USDT) أقل من المطلوب (${expectedAmount} USDT). الفرق المتبقي: ${Math.abs(difference).toFixed(6)} USDT. يرجى إكمال التحويل.`,
      });
    }

    // ─── VERIFIED (exact or overpaid) ────────────────────────────────────────
    if (verification.verified && deposit) {
      const finalTxHash = deposit.txId || txHash || payment.tx_hash || "";
      const finalBinanceId = deposit.id || payment.binance_order_id || "";
      const isOverpaid = paymentStatus === "overpaid";
      const resolvedNetwork = deposit?.network || payment.network || (finalTxHash.startsWith("0x") ? "BSC" : "TRC20");

      await db.collection("crypto_payments").updateOne(
        { order_id: orderId },
        {
          $set: {
            status: "completed",
            payment_status: paymentStatus || "exact",
            tx_hash: finalTxHash,
            binance_order_id: finalBinanceId,
            network: resolvedNetwork,
            actual_amount: actualAmount,
            expected_amount: expectedAmount,
            amount_difference: difference,
            refund_required: isOverpaid,
            verified_at: new Date(),
            metadata: JSON.stringify({ depositDetails: deposit, matchType: (verification as any).matchType }),
          },
        }
      );

      // Register official paid order in orders collection
      await db.collection("orders").insertOne({
        customer_name: payment.customer_name || "عميل بينانس",
        customer_email: "",
        customer_phone: payment.customer_phone || "",
        status: "paid",
        total: Number(actualAmount ?? payment.amount),
        metadata: JSON.stringify({
          cryptoOrderId: orderId,
          network: payment.network,
          currency: payment.currency,
          productName: payment.product_name,
          txHash: finalTxHash,
          binanceOrderId: finalBinanceId,
          paymentMethod: "binance_verified",
          paymentStatus: paymentStatus || "exact",
          actualAmount,
          expectedAmount,
          amountDifference: difference,
          refundRequired: isOverpaid,
        }),
        created_at: new Date(),
      });

      // Increment product real sales count
      if (payment.product_id && payment.product_id !== "cart") {
        let prodQuery: any = { sku: payment.product_id };
        if (ObjectId.isValid(payment.product_id)) {
          prodQuery = { $or: [{ _id: new ObjectId(payment.product_id) }, { sku: payment.product_id }] };
        }
        await db.collection("products").updateOne(prodQuery, { $inc: { sales_count: 1 } });
      }

      // Upsert customer if phone exists
      if (payment.customer_phone) {
        await db.collection("customers").updateOne(
          { phone: payment.customer_phone },
          {
            $set: {
              name: payment.customer_name || "عميل بينانس",
              phone: payment.customer_phone,
              updated_at: new Date(),
            },
            $inc: { total_orders: 1, total_spent: Number(actualAmount ?? payment.amount) },
            $setOnInsert: { created_at: new Date() },
          },
          { upsert: true }
        );
      }

      const successMessage = isOverpaid
        ? `تم التحقق من الدفع بنجاح! ⚠️ تنبيه: دفعت ${actualAmount} USDT وكان المطلوب ${expectedAmount} USDT. الفرق الزائد ${Math.abs(difference).toFixed(6)} USDT سيتم إعادته إليك.`
        : "تم التحقق من الدفع وتأكيده بنجاح من منصة بينانس!";

      return NextResponse.json({
        success: true,
        verified: true,
        status: "completed",
        paymentStatus: paymentStatus || "exact",
        actualAmount,
        expectedAmount,
        difference,
        refundRequired: isOverpaid,
        txHash: finalTxHash,
        message: successMessage,
        deposit,
      });
    }

    // ─── TX not found yet (no match / failed attempt) ────────────────────────
    const currentFailed = Math.max(Number(payment.failed_attempts || 0), Number(clientFailCount || 0));
    const newFailedCount = currentFailed + 1;
    const finalTx = txHash || payment.tx_hash || "";

    if (newFailedCount === 1) {
      // First failure: Record first attempt and allow 1 retry after 60 seconds
      await db.collection("crypto_payments").updateOne(
        { order_id: orderId },
        {
          $set: {
            failed_attempts: 1,
            last_attempt_at: new Date(),
            tx_hash: finalTx,
          },
        }
      );

      return NextResponse.json({
        success: true,
        verified: false,
        status: "retry_allowed",
        attemptsLeft: 1,
        retryAfterSeconds: 60,
        message: "لم يتم العثور على الإيداع بعد على شبكة بينانس. يرجى الانتظار دقيقة واحدة (60 ثانية) حتى تكتمل المعالجة ثم المحاولة مرة أخرى.",
        depositsFound: (verification as any).depositsFound,
      });
    }

    // Second failure: Permanently block further retries for this order and require WhatsApp support
    await db.collection("crypto_payments").updateOne(
      { order_id: orderId },
      {
        $set: {
          failed_attempts: 2,
          last_attempt_at: new Date(),
          status: "failed_exhausted",
          tx_hash: finalTx,
        },
      }
    );

    return NextResponse.json({
      success: true,
      verified: false,
      status: "failed_exhausted",
      attemptsLeft: 0,
      retryAfterSeconds: 60,
      message: "لم يتم تأكيد رمز المعاملة بعد محاولتين. يرجى التواصل مع الدعم الفني عبر الواتساب أو المحاولة مجدداً بعد دقيقة.",
      depositsFound: (verification as any).depositsFound,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Verification failed" }, { status: 500 });
  }
}
