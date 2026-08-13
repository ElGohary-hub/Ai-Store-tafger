import { NextRequest, NextResponse } from "next/server";
import { getAuthAdmin } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

async function requireAdmin(req: NextRequest) {
  const admin = await getAuthAdmin(req);
  if (!admin) throw new Error("Unauthorized");
  return admin;
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const db = await getDb();
    const categories = await db.collection("categories").find({}).sort({ sort_order: 1, _id: 1 }).toArray();
    return NextResponse.json(
      categories.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        slug: c.slug,
        image: c.image || "",
        visible: c.visible,
        sort_order: c.sort_order,
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
    const { name, slug, image, visible, sort_order } = body;
    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required." }, { status: 400 });
    }
    const db = await getDb();
    await db.collection("categories").insertOne({
      name,
      slug,
      image: image || "",
      visible: visible !== undefined ? (visible ? 1 : 0) : 1,
      sort_order: Number(sort_order) || 0,
      createdAt: new Date(),
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const { id, name, slug, image, visible, sort_order } = body;
    if (!id || !name || !slug) {
      return NextResponse.json({ error: "ID, name and slug are required." }, { status: 400 });
    }
    const db = await getDb();
    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { slug: id };
    await db.collection("categories").updateOne(query, {
      $set: {
        name,
        slug,
        image: image || "",
        visible: visible !== undefined ? (visible ? 1 : 0) : 1,
        sort_order: Number(sort_order) || 0,
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
    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { slug: id };
    await db.collection("categories").deleteOne(query);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
