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
  const search = req.nextUrl.searchParams.get("search")?.trim();
  let orders = [];
  if (search) {
    orders = db.prepare("SELECT * FROM orders WHERE customer_name LIKE ? OR customer_email LIKE ? OR customer_phone LIKE ? ORDER BY created_at DESC").all(`%${search}%`, `%${search}%`, `%${search}%`);
  } else {
    orders = db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all();
  }
  return NextResponse.json(orders);
}

export async function PUT(req: NextRequest) {
  requireAdmin(req);
  const body = await req.json();
  const { id, status } = body;
  if (!id || !status) {
    return NextResponse.json({ error: "ID and status are required." }, { status: 400 });
  }
  db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, Number(id));
  return NextResponse.json({ success: true });
}
