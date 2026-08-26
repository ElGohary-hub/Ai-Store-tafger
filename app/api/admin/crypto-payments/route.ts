import { NextRequest, NextResponse } from "next/server";
import { getAuthAdmin } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  const admin = await getAuthAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim();
  const statusFilter = searchParams.get("status")?.trim();
  const db = await getDb();

  let query: any = {};

  if (statusFilter === "completed" || statusFilter === "ok") {
    query.status = { $in: ["completed", "paid"] };
  } else if (statusFilter === "underpaid") {
    query.status = "underpaid";
  } else if (statusFilter === "pending") {
    query.status = "pending";
    query.tx_hash = { $exists: true, $ne: "" };
  } else if (statusFilter === "all") {
    // Return all without filter
  } else {
    // Default view: show verified payments, underpaid, OR transactions where user submitted a TxID
    query.$or = [
      { status: { $in: ["completed", "paid", "underpaid"] } },
      { tx_hash: { $exists: true, $ne: "" } },
    ];
  }

  if (search) {
    const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const safeSearch = escapeRegex(search);
    const searchConditions = [
      { customer_name: { $regex: safeSearch, $options: "i" } },
      { order_id: { $regex: safeSearch, $options: "i" } },
      { tx_hash: { $regex: safeSearch, $options: "i" } },
      { binance_order_id: { $regex: safeSearch, $options: "i" } },
    ];

    if (query.$or) {
      query = { $and: [query, { $or: searchConditions }] };
    } else {
      query.$or = searchConditions;
    }
  }

  const payments = await db.collection("crypto_payments").find(query).sort({ created_at: -1 }).toArray();

  return NextResponse.json({
    payments: payments.map((p) => {
      let explorer_url = "";
      if (p.tx_hash) {
        const hash = p.tx_hash.trim();
        let net = (p.network || "").toUpperCase();

        // Check if metadata contains the verified Binance deposit network
        try {
          if (p.metadata) {
            const parsed = typeof p.metadata === "string" ? JSON.parse(p.metadata) : p.metadata;
            if (parsed?.depositDetails?.network) {
              net = parsed.depositDetails.network.toUpperCase();
            }
          }
        } catch {}

        if (net === "BSC" || net === "BNB" || net === "BEP20") {
          explorer_url = `https://bscscan.com/tx/${hash}`;
        } else if (net === "TRC20" || net === "TRX" || net === "TRON") {
          explorer_url = `https://tronscan.org/#/transaction/${hash.replace(/^0x/, "")}`;
        } else if (net === "ETH" || net === "ERC20") {
          explorer_url = `https://etherscan.io/tx/${hash}`;
        } else if (net === "SOL" || net === "SOLANA") {
          explorer_url = `https://solscan.io/tx/${hash}`;
        } else if (net === "APT" || net === "APTOS") {
          explorer_url = `https://explorer.aptoslabs.com/txn/${hash}`;
        } else if (hash.startsWith("0x")) {
          // Standard EVM / BNB Smart Chain (BEP20) hash format
          explorer_url = `https://bscscan.com/tx/${hash}`;
        } else {
          // Standard Tron (TRC20) hash format
          explorer_url = `https://tronscan.org/#/transaction/${hash}`;
        }
      }

      return {
        id: p._id.toString(),
        order_id: p.order_id,
        customer_name: p.customer_name || "",
        customer_phone: p.customer_phone || "",
        product_name: p.product_name || "",
        amount: p.amount,
        currency: p.currency || "USDT",
        network: p.network || "TRC20",
        tx_hash: p.tx_hash || "",
        status: p.status || "pending",
        binance_order_id: p.binance_order_id || "",
        explorer_url,
        created_at: p.created_at || new Date().toISOString(),
        verified_at: p.verified_at || "",
        // Payment audit fields
        payment_status: p.payment_status || null,
        actual_amount: p.actual_amount ?? null,
        expected_amount: p.expected_amount ?? p.amount,
        amount_difference: p.amount_difference ?? null,
        refund_required: p.refund_required ?? false,
      };
    }),
  });
}

export async function PATCH(req: NextRequest) {
  const admin = await getAuthAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, status } = await req.json();
  if (!id || !status) {
    return NextResponse.json({ error: "id and status are required" }, { status: 400 });
  }

  const db = await getDb();
  const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { order_id: id };
  await db.collection("crypto_payments").updateOne(query, { $set: { status, updatedAt: new Date() } });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const admin = await getAuthAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, clearAll } = await req.json();
  const db = await getDb();

  if (clearAll) {
    await db.collection("crypto_payments").deleteMany({});
    return NextResponse.json({ success: true, message: "All crypto payments deleted" });
  }

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { order_id: id };
  const result = await db.collection("crypto_payments").deleteOne(query);

  return NextResponse.json({ success: true, deletedCount: result.deletedCount });
}
