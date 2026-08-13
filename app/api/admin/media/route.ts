import { NextRequest, NextResponse } from "next/server";
import { getAuthAdmin } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from "fs";
import { join, basename } from "path";
import { ObjectId } from "mongodb";

async function requireAdmin(req: NextRequest) {
  const admin = await getAuthAdmin(req);
  if (!admin) throw new Error("Unauthorized");
  return admin;
}

const uploadDir = join(process.cwd(), "public", "uploads");
if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const db = await getDb();
    const media = await db.collection("media").find({}).sort({ created_at: -1 }).toArray();
    return NextResponse.json(
      media.map((m) => ({
        id: m._id.toString(),
        url: m.url,
        filename: m.filename,
        type: m.type,
      }))
    );
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
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

    const db = await getDb();
    const result = await db.collection("media").insertOne({
      url,
      filename,
      type: file.type || "image",
      created_at: new Date(),
    });

    return NextResponse.json({ success: true, id: result.insertedId.toString(), url });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "ID is required." }, { status: 400 });
    }
    const db = await getDb();
    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { filename: id };
    const mediaItem = await db.collection("media").findOne(query);
    if (!mediaItem) {
      return NextResponse.json({ error: "Media item not found." }, { status: 404 });
    }
    const filePath = join(uploadDir, basename(mediaItem.filename));
    if (existsSync(filePath)) {
      try {
        unlinkSync(filePath);
      } catch {}
    }
    await db.collection("media").deleteOne(query);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
