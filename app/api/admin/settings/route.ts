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
  const rows = db.prepare("SELECT key, value FROM settings").all();
  const settings: Record<string, string> = {};
  rows.forEach((row: { key: string; value: string }) => {
    settings[row.key] = row.value;
  });
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  requireAdmin(req);
  const body = await req.json();
  const keys = Object.keys(body);
  const statement = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
  db.transaction(() => {
    keys.forEach((key) => {
      statement.run(key, String(body[key] ?? ""));
    });
  })();
  return NextResponse.json({ success: true });
}
