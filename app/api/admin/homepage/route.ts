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
    const sections = await db.collection("homepage_sections").find({}).sort({ sort_order: 1 }).toArray();
    return NextResponse.json(
      sections.map((s) => ({
        id: s._id.toString(),
        section_key: s.section_key,
        title: s.title || "",
        description: s.description || "",
        button_text: s.button_text || "",
        button_url: s.button_url || "",
        image: s.image || "",
        visible: s.visible,
        sort_order: s.sort_order,
        metadata: s.metadata || "",
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
    const { section_key, title, description, button_text, button_url, image, visible, sort_order, metadata } = body;
    if (!section_key) {
      return NextResponse.json({ error: "Section key is required." }, { status: 400 });
    }
    const db = await getDb();
    await db.collection("homepage_sections").insertOne({
      section_key,
      title: title || "",
      description: description || "",
      button_text: button_text || "",
      button_url: button_url || "",
      image: image || "",
      visible: visible !== undefined ? (visible ? 1 : 0) : 1,
      sort_order: Number(sort_order) || 0,
      metadata: metadata || "",
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
    const { id, title, description, button_text, button_url, image, visible, sort_order, metadata } = body;
    if (!id) {
      return NextResponse.json({ error: "ID is required." }, { status: 400 });
    }
    const db = await getDb();
    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { section_key: id };
    await db.collection("homepage_sections").updateOne(query, {
      $set: {
        title: title || "",
        description: description || "",
        button_text: button_text || "",
        button_url: button_url || "",
        image: image || "",
        visible: visible !== undefined ? (visible ? 1 : 0) : 1,
        sort_order: Number(sort_order) || 0,
        metadata: metadata || "",
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
    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { section_key: id };
    await db.collection("homepage_sections").deleteOne(query);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
