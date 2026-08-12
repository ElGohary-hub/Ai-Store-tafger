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
  let customers = [];
  if (search) {
    customers = db.prepare("SELECT * FROM customers WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? ORDER BY last_order_at DESC").all(`%${search}%`, `%${search}%`, `%${search}%`);
  } else {
    customers = db.prepare("SELECT * FROM customers ORDER BY last_order_at DESC").all();
  }
  return NextResponse.json(customers);
}
