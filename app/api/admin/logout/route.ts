import { NextResponse } from "next/server";
import { revokeSession } from "@/lib/auth";

export async function POST(req: Request) {
  const token = req.cookies.get("cms_token")?.value;
  revokeSession(token);
  const response = NextResponse.json({ success: true });
  response.cookies.set("cms_token", "", { path: "/", maxAge: 0 });
  return response;
}
