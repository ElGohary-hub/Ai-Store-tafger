import { NextResponse } from "next/server";
import { getAdminBySessionToken } from "@/lib/auth";
import db from "@/lib/db";

export async function GET(req: Request) {
  const token = req.cookies.get("cms_token")?.value;
  const admin = getAdminBySessionToken(token);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const totalProducts = db.prepare("SELECT COUNT(*) FROM products").pluck().get();
  const activeProducts = db.prepare("SELECT COUNT(*) FROM products WHERE visible = 1").pluck().get();
  const hiddenProducts = db.prepare("SELECT COUNT(*) FROM products WHERE visible = 0").pluck().get();
  const totalOrders = db.prepare("SELECT COUNT(*) FROM orders").pluck().get();
  const newOrders = db.prepare("SELECT COUNT(*) FROM orders WHERE status = 'pending'").pluck().get();
  const totalCustomers = db.prepare("SELECT COUNT(*) FROM customers").pluck().get();
  const totalSales = db.prepare("SELECT SUM(total) FROM orders").pluck().get() || 0;
  const recentOrders = db.prepare("SELECT id, customer_name, total, status, created_at FROM orders ORDER BY created_at DESC LIMIT 5").all();
  const bestSellingProducts = db.prepare("SELECT p.name, SUM(oi.quantity) AS sold FROM order_items oi JOIN products p ON oi.product_id = p.id GROUP BY p.id ORDER BY sold DESC LIMIT 5").all();

  return NextResponse.json({
    totalProducts,
    activeProducts,
    hiddenProducts,
    totalOrders,
    newOrders,
    totalCustomers,
    totalSales,
    recentOrders,
    bestSellingProducts,
  });
}
