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
  const categories = db.prepare("SELECT * FROM categories ORDER BY sort_order ASC, id ASC").all();
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  requireAdmin(req);
  const body = await req.json();
  const { name, slug, image, visible, sort_order } = body;
  if (!name || !slug) {
    return NextResponse.json({ error: "Name and slug are required." }, { status: 400 });
  }
  db.prepare("INSERT INTO categories (name, slug, image, visible, sort_order) VALUES (?, ?, ?, ?, ?)").run(name, slug, image || "", visible ? 1 : 0, Number(sort_order) || 0);
  return NextResponse.json({ success: true });
}

export async function PUT(req: NextRequest) {
  requireAdmin(req);
  const body = await req.json();
  const { id, name, slug, image, visible, sort_order } = body;
  if (!id || !name || !slug) {
    return NextResponse.json({ error: "ID, name and slug are required." }, { status: 400 });
  }
  db.prepare("UPDATE categories SET name = ?, slug = ?, image = ?, visible = ?, sort_order = ? WHERE id = ?").run(name, slug, image || "", visible ? 1 : 0, Number(sort_order) || 0, Number(id));
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  requireAdmin(req);
  const body = await req.json();
  const { id } = body;
  if (!id) {
    return NextResponse.json({ error: "ID is required." }, { status: 400 });
  }
  db.prepare("DELETE FROM categories WHERE id = ?").run(Number(id));
  return NextResponse.json({ success: true });
}
