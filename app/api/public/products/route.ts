import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const rawProducts = await db
      .collection("products")
      .find({ visible: { $ne: 0 } })
      .sort({ sort_order: 1, _id: 1 })
      .toArray();

    const products = rawProducts.map((p) => ({
      id: p.sku || p._id.toString(),
      _id: p._id.toString(),
      sku: p.sku || p._id.toString(),
      name: p.name,
      description: p.description || "",
      detail: p.description || "",
      price: p.price,
      original_price: p.original_price,
      discount_enabled: p.discount_enabled,
      discount_percentage: p.discount_percentage,
      featured: p.featured,
      best_seller: p.best_seller,
      is_new: p.is_new,
      visible: p.visible,
      stock: p.stock,
      category_id: p.category_id,
      image: p.image,
      sort_order: p.sort_order,
      tags: p.tags,
    }));

    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
