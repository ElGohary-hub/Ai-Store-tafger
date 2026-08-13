import { NextRequest, NextResponse } from "next/server";
import { getAuthAdmin } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

async function requireAdmin(req: NextRequest) {
  const admin = await getAuthAdmin(req);
  if (!admin) throw new Error("Unauthorized");
  return admin;
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const db = await getDb();
    const rows = await db.collection("settings").find({}).toArray();
    const settings: Record<string, string> = {};
    rows.forEach((row) => {
      settings[row.key] = row.value;
    });
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const keys = Object.keys(body);
    const db = await getDb();

    await Promise.all(
      keys.map((key) =>
        db.collection("settings").updateOne(
          { key },
          { $set: { key, value: String(body[key] ?? "") } },
          { upsert: true }
        )
      )
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
