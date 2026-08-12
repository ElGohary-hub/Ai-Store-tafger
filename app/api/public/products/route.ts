import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const products = db
    .prepare(`SELECT p.id, p.sku, p.name, p.description, p.price, p.original_price, p.discount_enabled, p.discount_percentage, p.featured, p.best_seller, p.is_new, p.visible, p.stock, p.category_id, p.image, p.sort_order, p.tags, c.name as category_name, c.slug as category_slug FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.visible = 1 ORDER BY p.sort_order ASC, p.id ASC`)
    .all();
  return NextResponse.json(products);
}
