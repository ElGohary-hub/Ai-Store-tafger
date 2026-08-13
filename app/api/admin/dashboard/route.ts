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
    db.collection("orders").countDocuments(),
    db.collection("orders").countDocuments({ status: "pending" }),
    db.collection("customers").countDocuments(),
    db.collection("orders").aggregate([{ $group: { _id: null, total: { $sum: "$total" } } }]).toArray(),
    db.collection("orders").find({}).sort({ created_at: -1, _id: -1 }).limit(5).toArray(),
  ]);

  const totalSales = salesAgg.length > 0 ? salesAgg[0].total : 0;

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
      total: o.total || 0,
      status: o.status || "pending",
      created_at: o.created_at || new Date().toISOString(),
    })),
    bestSellingProducts: [],
  });
}
