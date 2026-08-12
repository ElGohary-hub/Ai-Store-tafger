import { NextRequest, NextResponse } from "next/server";
import { getAdminByEmail } from "@/lib/db";
import { verifyPassword } from "@/lib/security";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const user = getAdminByEmail(email);
  if (!user || !verifyPassword(password, user.password)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const session = createSession(user.id);
  const response = NextResponse.json({ success: true, token: session.token, expiresAt: session.expiresAt });
  response.cookies.set("cms_token", session.token, {
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
  });
  return response;
}
