import { NextRequest, NextResponse } from "next/server";
import { revokeSession } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  let token = req.cookies.get("cms_token")?.value;
  if (!token) {
    try {
      token = (await cookies()).get("cms_token")?.value;
    } catch {}
  }
  revokeSession(token);
  const response = NextResponse.json({ success: true });
  response.cookies.set("cms_token", "", { path: "/", maxAge: 0 });
  return response;
}
