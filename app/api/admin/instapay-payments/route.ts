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

  if (statusFilter && statusFilter !== "all") {
    query.status = statusFilter;
  }

  if (search) {
    const searchConditions = [
      { customer_name: { $regex: search, $options: "i" } },
      { customer_phone: { $regex: search, $options: "i" } },
      { order_id: { $regex: search, $options: "i" } },
      { product_name: { $regex: search, $options: "i" } },
    ];

    if (query.status) {
      query = { $and: [{ status: query.status }, { $or: searchConditions }] };
    } else {
      query.$or = searchConditions;
    }
  }

  const payments = await db.collection("instapay_payments").find(query).sort({ created_at: -1 }).toArray();

  return NextResponse.json({
    payments: payments.map((p) => ({
      id: p._id.toString(),
      order_id: p.order_id,
      customer_name: p.customer_name || "عميل إنستاباي",
      customer_phone: p.customer_phone || "",
      product_id: p.product_id || "",
      product_name: p.product_name || "منتج AI",
      amount: Number(p.amount || 0),
      currency: p.currency || "ج.م",
      payment_method: p.payment_method || "instapay",
      receipt_url: p.receipt_url || "",
      status: p.status || "pending",
      created_at: p.created_at || new Date().toISOString(),
      confirmed_at: p.confirmed_at || "",
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
  const payment = await db.collection("instapay_payments").findOne(query);

  if (!payment) {
    return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
  }

  const updateFields: any = { status, updated_at: new Date() };
  if (status === "confirmed" && !payment.confirmed_at) {
    updateFields.confirmed_at = new Date();
  }

  await db.collection("instapay_payments").updateOne(query, { $set: updateFields });

  // If status is confirmed and was not confirmed previously:
  if (status === "confirmed" && payment.status !== "confirmed") {
    // 1. Create paid order in orders collection
    await db.collection("orders").insertOne({
      customer_name: payment.customer_name || "عميل إنستاباي / فودافون",
      customer_email: "",
      customer_phone: payment.customer_phone || "",
      status: "paid",
      total: Number(payment.amount || 0),
      metadata: JSON.stringify({
        instapayOrderId: payment.order_id,
        receiptUrl: payment.receipt_url,
        productName: payment.product_name,
        paymentMethod: payment.payment_method || "instapay",
      }),
      created_at: new Date(),
    });

    // 2. Increment product sales count
    if (payment.product_id && payment.product_id !== "cart") {
      let prodQuery: any = { sku: payment.product_id };
      if (ObjectId.isValid(payment.product_id)) {
        prodQuery = { $or: [{ _id: new ObjectId(payment.product_id) }, { sku: payment.product_id }] };
      }
      await db.collection("products").updateOne(prodQuery, { $inc: { sales_count: 1 } });
    }

    // 3. Upsert customer
    if (payment.customer_phone) {
      await db.collection("customers").updateOne(
        { phone: payment.customer_phone },
        {
          $set: {
            name: payment.customer_name || "عميل إنستاباي",
            phone: payment.customer_phone,
            updated_at: new Date(),
          },
          $inc: { total_orders: 1, total_spent: Number(payment.amount || 0) },
          $setOnInsert: { created_at: new Date() },
        },
        { upsert: true }
      );
    }
  }

  return NextResponse.json({ success: true, status });
}

export async function DELETE(req: NextRequest) {
  const admin = await getAuthAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, clearAll } = await req.json();
  const db = await getDb();

  if (clearAll) {
    await db.collection("instapay_payments").deleteMany({});
    return NextResponse.json({ success: true, message: "All InstaPay payments deleted" });
  }

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { order_id: id };
  const result = await db.collection("instapay_payments").deleteOne(query);

  return NextResponse.json({ success: true, deletedCount: result.deletedCount });
}
