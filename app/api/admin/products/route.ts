import { NextRequest, NextResponse } from "next/server";
import { getAdminBySessionToken } from "@/lib/auth";
import db from "@/lib/db";

function requireAdmin(req: NextRequest) {
  const token = req.cookies.get("cms_token")?.value;
  const admin = getAdminBySessionToken(token);
  if (!admin) throw new Error("Unauthorized");
  return admin;
}

export async function GET(req: NextRequest) {
  requireAdmin(req);
  const products = db
    .prepare(`SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.sort_order ASC, p.id ASC`)
    .all();
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  requireAdmin(req);
  const body = await req.json();
  const {
    sku,
    name,
    description,
    price,
    original_price,
    discount_enabled,
    discount_percentage,
    featured,
    best_seller,
    is_new,
    visible,
    stock,
    category_id,
    image,
    sort_order,
    tags,
  } = body;

  if (!sku || !name) {
    return NextResponse.json({ error: "SKU and name are required." }, { status: 400 });
  }

  const result = db
    .prepare(`INSERT INTO products (sku, name, description, price, original_price, discount_enabled, discount_percentage, featured, best_seller, is_new, visible, stock, category_id, image, sort_order, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(
      sku,
      name,
      description || "",
      Number(price) || 0,
      Number(original_price) || 0,
      discount_enabled ? 1 : 0,
      Number(discount_percentage) || 0,
      featured ? 1 : 0,
      best_seller ? 1 : 0,
      is_new ? 1 : 0,
      visible ? 1 : 0,
      Number(stock) || 0,
      category_id || null,
      image || "",
      Number(sort_order) || 0,
      tags || "",
    );

  return NextResponse.json({ success: true, id: result.lastInsertRowid });
}

export async function PUT(req: NextRequest) {
  requireAdmin(req);
  const body = await req.json();
  const {
    id,
    sku,
    name,
    description,
    price,
    original_price,
    discount_enabled,
    discount_percentage,
    featured,
    best_seller,
    is_new,
    visible,
    stock,
    category_id,
    image,
    sort_order,
    tags,
  } = body;

  if (!id || !sku || !name) {
    return NextResponse.json({ error: "ID, SKU and name are required." }, { status: 400 });
  }

  db.prepare(`UPDATE products SET sku = ?, name = ?, description = ?, price = ?, original_price = ?, discount_enabled = ?, discount_percentage = ?, featured = ?, best_seller = ?, is_new = ?, visible = ?, stock = ?, category_id = ?, image = ?, sort_order = ?, tags = ? WHERE id = ?`)
    .run(
      sku,
      name,
      description || "",
      Number(price) || 0,
      Number(original_price) || 0,
      discount_enabled ? 1 : 0,
      Number(discount_percentage) || 0,
      featured ? 1 : 0,
      best_seller ? 1 : 0,
      is_new ? 1 : 0,
      visible ? 1 : 0,
      Number(stock) || 0,
      category_id || null,
      image || "",
      Number(sort_order) || 0,
      tags || "",
      Number(id),
    );

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  requireAdmin(req);
  const body = await req.json();
  const { id } = body;
  if (!id) {
    return NextResponse.json({ error: "ID is required." }, { status: 400 });
  }

  db.prepare("DELETE FROM products WHERE id = ?").run(Number(id));
  return NextResponse.json({ success: true });
}
