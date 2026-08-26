import { NextRequest, NextResponse } from "next/server";
import { getAuthAdmin } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

async function requireAdmin(req: NextRequest) {
  const admin = await getAuthAdmin(req);
  if (!admin) throw new Error("Unauthorized");
  return admin;
}

function sanitizePlans(plans: any) {
  if (!Array.isArray(plans)) return [];
  return plans
    .filter((p) => p && typeof p === "object" && p.name && (Number(p.price) > 0 || p.price !== undefined || Number(p.price_usd) > 0))
    .map((p) => ({
      name: String(p.name).trim(),
      price: Number(p.price) || 0,
      price_usd: Number(p.price_usd) || 0,
      original_price: Number(p.original_price) || 0,
      original_price_usd: Number(p.original_price_usd) || 0,
      discount_badge: p.discount_badge ? String(p.discount_badge).trim() : "",
    }));
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const db = await getDb();
    const products = await db.collection("products").find({}).sort({ sort_order: 1, _id: 1 }).toArray();
    const categories = await db.collection("categories").find({}).toArray();
    const catMap = new Map(categories.map((c) => [c._id.toString(), c.name]));

    return NextResponse.json(
      products.map((p) => ({
        id: p._id.toString(),
        sku: p.sku || p._id.toString(),
        name: p.name,
        description: p.description || "",
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
        category_name: p.category_id ? catMap.get(String(p.category_id)) : "",
        image: p.image,
        sort_order: p.sort_order,
        tags: p.tags,
        sales_count: Number(p.sales_count) || 0,
        fake_sales_count: Number(p.fake_sales_count) || 0,
        long_description: p.long_description || p.description || "",
        warranty: p.warranty || "",
        plans: sanitizePlans(p.plans),
      }))
    );
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const {
      sku,
      name,
      description,
      long_description,
      warranty,
      price,
      price_usd,
      original_price,
      original_price_usd,
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
      sales_count,
      fake_sales_count,
      plans,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    const cleanPlans = sanitizePlans(plans);

    const db = await getDb();
    const result = await db.collection("products").insertOne({
      sku: sku || name.toLowerCase().replace(/\s+/g, "-"),
      name,
      description: description || "",
      long_description: long_description || description || "",
      warranty: warranty || "",
      price: cleanPlans.length > 0 ? cleanPlans[0].price : Number(price) || 0,
      price_usd: cleanPlans.length > 0 && cleanPlans[0].price_usd ? cleanPlans[0].price_usd : Number(price_usd) || 0,
      original_price: cleanPlans.length > 0 && cleanPlans[0].original_price ? cleanPlans[0].original_price : Number(original_price) || 0,
      original_price_usd: cleanPlans.length > 0 && cleanPlans[0].original_price_usd ? cleanPlans[0].original_price_usd : Number(original_price_usd) || 0,
      discount_enabled: discount_enabled ? 1 : 0,
      discount_percentage: Number(discount_percentage) || 0,
      featured: featured ? 1 : 0,
      best_seller: best_seller ? 1 : 0,
      is_new: is_new ? 1 : 0,
      visible: visible !== undefined ? (visible ? 1 : 0) : 1,
      stock: Number(stock) || 0,
      category_id: category_id || null,
      image: image || "",
      sort_order: Number(sort_order) || 0,
      tags: tags || "",
      sales_count: Number(sales_count) || 0,
      fake_sales_count: Number(fake_sales_count) || 0,
      plans: cleanPlans,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id: result.insertedId.toString() });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const {
      id,
      sku,
      name,
      description,
      long_description,
      warranty,
      price,
      price_usd,
      original_price,
      original_price_usd,
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
      sales_count,
      fake_sales_count,
      plans,
    } = body;

    if (!id || !name) {
      return NextResponse.json({ error: "ID and name are required." }, { status: 400 });
    }

    const cleanPlans = sanitizePlans(plans);

    const db = await getDb();
    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { sku: id };

    await db.collection("products").updateOne(query, {
      $set: {
        sku: sku || name.toLowerCase().replace(/\s+/g, "-"),
        name,
        description: description || "",
        long_description: long_description || description || "",
        warranty: warranty || "",
        price: cleanPlans.length > 0 ? cleanPlans[0].price : Number(price) || 0,
        price_usd: cleanPlans.length > 0 && cleanPlans[0].price_usd ? cleanPlans[0].price_usd : Number(price_usd) || 0,
        original_price: cleanPlans.length > 0 && cleanPlans[0].original_price ? cleanPlans[0].original_price : Number(original_price) || 0,
        original_price_usd: cleanPlans.length > 0 && cleanPlans[0].original_price_usd ? cleanPlans[0].original_price_usd : Number(original_price_usd) || 0,
        discount_enabled: discount_enabled ? 1 : 0,
        discount_percentage: Number(discount_percentage) || 0,
        featured: featured ? 1 : 0,
        best_seller: best_seller ? 1 : 0,
        is_new: is_new ? 1 : 0,
        visible: visible !== undefined ? (visible ? 1 : 0) : 1,
        stock: Number(stock) || 0,
        category_id: category_id || null,
        image: image || "",
        sort_order: Number(sort_order) || 0,
        tags: tags || "",
        sales_count: Number(sales_count) || 0,
        fake_sales_count: Number(fake_sales_count) || 0,
        plans: cleanPlans,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: "ID is required." }, { status: 400 });
    }

    const db = await getDb();
    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { sku: id };
    await db.collection("products").deleteOne(query);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
