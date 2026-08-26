import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { randomBytes } from "crypto";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const rateLimit = checkRateLimit(`crypto_order_${ip}`, { limit: 20, windowMs: 10 * 60 * 1000 }); // Max 20 crypto order creations per 10 mins
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "تم تجاوز الحد المسموح من الطلبات. يرجى الانتظار قليلاً." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { customerName, customerPhone, productId, productName, amount, network, currency = "USDT" } = body;

    if (!productId || !amount) {
      return NextResponse.json({ error: "Missing required order data" }, { status: 400 });
    }

    const orderId = `CRYPTO-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}`;
    const db = await getDb();

    // Insert pending session into crypto_payments collection
    await db.collection("crypto_payments").insertOne({
      order_id: orderId,
      customer_name: customerName || "عميل كريبتو",
      customer_phone: customerPhone || "",
      product_id: String(productId),
      product_name: productName || "",
      amount: Number(amount),
      currency,
      network: network || "TRC20",
      status: "pending",
      created_at: new Date(),
    });

    return NextResponse.json({
      success: true,
      orderId,
      amount: Number(amount),
      currency,
      network,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create crypto order" }, { status: 500 });
  }
}
