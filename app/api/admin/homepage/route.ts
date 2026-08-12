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
  const sections = db.prepare("SELECT * FROM homepage_sections ORDER BY sort_order ASC").all();
  return NextResponse.json(sections);
}

export async function POST(req: NextRequest) {
  requireAdmin(req);
  const body = await req.json();
  const { section_key, title, description, button_text, button_url, image, visible, sort_order, metadata } = body;
  if (!section_key) {
    return NextResponse.json({ error: "Section key is required." }, { status: 400 });
  }
  db.prepare("INSERT INTO homepage_sections (section_key, title, description, button_text, button_url, image, visible, sort_order, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(section_key, title || "", description || "", button_text || "", button_url || "", image || "", visible ? 1 : 0, Number(sort_order) || 0, metadata || "");
  return NextResponse.json({ success: true });
}

export async function PUT(req: NextRequest) {
  requireAdmin(req);
  const body = await req.json();
  const { id, title, description, button_text, button_url, image, visible, sort_order, metadata } = body;
  if (!id) {
    return NextResponse.json({ error: "ID is required." }, { status: 400 });
  }
  db.prepare("UPDATE homepage_sections SET title = ?, description = ?, button_text = ?, button_url = ?, image = ?, visible = ?, sort_order = ?, metadata = ? WHERE id = ?").run(title || "", description || "", button_text || "", button_url || "", image || "", visible ? 1 : 0, Number(sort_order) || 0, metadata || "", Number(id));
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  requireAdmin(req);
  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "ID is required." }, { status: 400 });
  }
  db.prepare("DELETE FROM homepage_sections WHERE id = ?").run(Number(id));
  return NextResponse.json({ success: true });
}
