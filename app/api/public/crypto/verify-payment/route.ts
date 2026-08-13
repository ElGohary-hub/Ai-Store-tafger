import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { checkPaymentDeposit } from "@/lib/binance";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, txHash } = body;

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
        message: "تم تأكيد الدفع مسبقاً بنجاح لهذا الطلب!",
        payment,
      });
    }

    // Retrieve all previously completed payments to prevent reusing old deposits
    const completedPayments = await db
      .collection("crypto_payments")
      .find({ status: "completed", order_id: { $ne: orderId } })
      .project({ tx_hash: 1, binance_order_id: 1 })
      .toArray();

    const usedTxHashes = completedPayments
      .map((p) => p.tx_hash)
      .filter(Boolean) as string[];
    const usedDepositIds = completedPayments
      .map((p) => p.binance_order_id)
      .filter(Boolean) as string[];

    const createdAtTimestamp = new Date(payment.created_at).getTime();

    // Call Binance live verification with strict rules
    const verification = await checkPaymentDeposit({
      expectedAmount: payment.amount,
      coin: payment.currency || "USDT",
      txHash: txHash || payment.tx_hash,
      createdAtTimestamp,
      usedTxHashes,
      usedDepositIds,
    });

    if (verification.verified && verification.deposit) {
      const deposit = verification.deposit;

      // Update payment record in MongoDB
      await db.collection("crypto_payments").updateOne(
        { order_id: orderId },
        {
          $set: {
            status: "completed",
            tx_hash: deposit.txId,
            binance_order_id: deposit.id,
            verified_at: new Date(),
            metadata: JSON.stringify({ depositDetails: deposit, matchType: verification.matchType }),
          },
        }
      );

      // Also update matching general order
      await db.collection("orders").updateMany(
        { metadata: { $regex: `"cryptoOrderId":"${orderId}"` } },
        { $set: { status: "paid" } }
      );

      return NextResponse.json({
        success: true,
        verified: true,
        status: "completed",
        message: "تم التحقق من الدفع وتأكيده بنجاح من منصة بينانس!",
        deposit,
      });
    }

    // If txHash was provided, store it as pending verification
    if (txHash && txHash !== payment.tx_hash) {
      await db.collection("crypto_payments").updateOne(
        { order_id: orderId },
        { $set: { tx_hash: txHash } }
      );
    }

    return NextResponse.json({
      success: true,
      verified: false,
      status: "pending",
      message:
        (verification as any).error ||
        "لم يتم العثور على إيداع مطابق حتى الآن، يرجى التأكد من التحويل أو إدخال رمز المعاملة (TxID) الصحيح.",
      depositsFound: verification.depositsFound,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Verification failed" }, { status: 500 });
  }
}
