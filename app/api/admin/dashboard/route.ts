import { NextRequest, NextResponse } from "next/server";
import { getAuthAdmin } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  const admin = await getAuthAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();

  const [
    totalProducts,
    activeProducts,
    hiddenProducts,
    totalOrders,
    newOrders,
    totalCustomers,
    salesAgg,
    recentOrders,
  ] = await Promise.all([
    db.collection("products").countDocuments(),
    db.collection("products").countDocuments({ visible: { $ne: 0 } }),
    db.collection("products").countDocuments({ visible: 0 }),
    db.collection("orders").countDocuments({ status: { $in: ["paid", "completed"] } }),
    db.collection("orders").countDocuments({ status: "paid" }),
    db.collection("customers").countDocuments(),
    db.collection("orders").aggregate([
      { $match: { status: { $in: ["paid", "completed"] } } },
      { $group: { _id: null, total: { $sum: "$total" } } }
    ]).toArray(),
    db.collection("orders").find({ status: { $in: ["paid", "completed"] } }).sort({ created_at: -1, _id: -1 }).limit(5).toArray(),
  ]);

  const rawSales = salesAgg.length > 0 ? Number(salesAgg[0].total || 0) : 0;
  const totalSales = Math.round(rawSales * 100) / 100;

  return NextResponse.json({
    totalProducts,
    activeProducts,
    hiddenProducts,
    totalOrders,
    newOrders,
    totalCustomers,
    totalSales,
    recentOrders: recentOrders.map((o) => ({
      id: o._id.toString(),
      customer_name: o.customer_name || "Guest",
      total: Math.round(Number(o.total || 0) * 100) / 100,
      status: o.status || "pending",
      created_at: o.created_at || new Date().toISOString(),
    })),
    bestSellingProducts: [],
  });
}
