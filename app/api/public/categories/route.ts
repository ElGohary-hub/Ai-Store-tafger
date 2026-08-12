import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const categories = db.prepare("SELECT * FROM categories WHERE visible = 1 ORDER BY sort_order ASC, id ASC").all();
  return NextResponse.json(categories);
}
