import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

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
      price_usd: p.price_usd !== undefined ? p.price_usd : 0,
      original_price: p.original_price,
      original_price_usd: p.original_price_usd !== undefined ? p.original_price_usd : 0,
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
      sales_count: Number(p.sales_count) || 0,
      fake_sales_count: Number(p.fake_sales_count) || 0,
      long_description: p.long_description || p.description || "",
      warranty: p.warranty || "",
      plans: Array.isArray(p.plans) ? p.plans : [],
    }));

    return NextResponse.json(products, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
