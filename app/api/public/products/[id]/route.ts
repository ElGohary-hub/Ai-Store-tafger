import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const db = await getDb();
    
    // Search by ObjectId, sku, or slug
    let query: any = { sku: id };
    if (ObjectId.isValid(id)) {
      query = { $or: [{ _id: new ObjectId(id) }, { sku: id }] };
    }

    const rawProduct = await db.collection("products").findOne(query);

    if (!rawProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Get category name if category_id exists
    let category_name = "عام";
    if (rawProduct.category_id) {
      let catQuery: any = { _id: rawProduct.category_id };
      if (ObjectId.isValid(rawProduct.category_id)) {
        catQuery = { _id: new ObjectId(rawProduct.category_id) };
      }
      const cat = await db.collection("categories").findOne(catQuery);
      if (cat) category_name = cat.name;
    }

    const product = {
      id: rawProduct.sku || rawProduct._id.toString(),
      _id: rawProduct._id.toString(),
      sku: rawProduct.sku || rawProduct._id.toString(),
      name: rawProduct.name,
      description: rawProduct.description || "",
      detail: rawProduct.description || "",
      long_description: rawProduct.long_description || rawProduct.description || "",
      price: rawProduct.price,
      original_price: rawProduct.original_price,
      discount_enabled: rawProduct.discount_enabled,
      discount_percentage: rawProduct.discount_percentage,
      featured: rawProduct.featured,
      best_seller: rawProduct.best_seller,
      is_new: rawProduct.is_new,
      visible: rawProduct.visible,
      stock: rawProduct.stock,
      category_id: rawProduct.category_id,
      category_name,
      image: rawProduct.image,
      sort_order: rawProduct.sort_order,
      tags: rawProduct.tags,
      sales_count: Number(rawProduct.sales_count) || 0,
      fake_sales_count: Number(rawProduct.fake_sales_count) || 0,
      warranty: rawProduct.warranty || "",
    };

    return NextResponse.json(product, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
