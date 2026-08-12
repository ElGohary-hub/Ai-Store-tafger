import { NextRequest, NextResponse } from "next/server";
import { getAdminBySessionToken } from "@/lib/auth";
import db from "@/lib/db";
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from "fs";
import { join, basename } from "path";

function requireAdmin(req: NextRequest) {
  const token = req.cookies.get("cms_token")?.value;
  const admin = getAdminBySessionToken(token);
  if (!admin) throw new Error("Unauthorized");
  return admin;
}

const uploadDir = join(process.cwd(), "public", "uploads");
if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

export async function GET(req: NextRequest) {
  requireAdmin(req);
  const media = db.prepare("SELECT * FROM media ORDER BY created_at DESC").all();
  return NextResponse.json(media);
}

export async function POST(req: NextRequest) {
  requireAdmin(req);
  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "File upload is required." }, { status: 400 });
  }
  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
  const filePath = join(uploadDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  writeFileSync(filePath, buffer);
  const url = `/uploads/${filename}`;
  const result = db.prepare("INSERT INTO media (url, filename, type) VALUES (?, ?, ?)").run(url, filename, file.type || "image");
  return NextResponse.json({ success: true, id: result.lastInsertRowid, url });
}

export async function DELETE(req: NextRequest) {
  requireAdmin(req);
  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "ID is required." }, { status: 400 });
  }
  const mediaItem = db.prepare("SELECT * FROM media WHERE id = ?").get(Number(id));
  if (!mediaItem) {
    return NextResponse.json({ error: "Media item not found." }, { status: 404 });
  }
  const filePath = join(uploadDir, basename(mediaItem.filename));
  if (existsSync(filePath)) {
    unlinkSync(filePath);
  }
  db.prepare("DELETE FROM media WHERE id = ?").run(Number(id));
  return NextResponse.json({ success: true });
}
