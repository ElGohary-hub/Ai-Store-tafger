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
  const db = await getDb();

  let query: any = {};
  if (search) {
    query = {
      $or: [
        { customer_name: { $regex: search, $options: "i" } },
        { order_id: { $regex: search, $options: "i" } },
        { tx_hash: { $regex: search, $options: "i" } },
      ],
    };
  }

  const payments = await db.collection("crypto_payments").find(query).sort({ created_at: -1 }).toArray();

  return NextResponse.json({
    payments: payments.map((p) => ({
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
      created_at: p.created_at || new Date().toISOString(),
      verified_at: p.verified_at || "",
    })),
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
