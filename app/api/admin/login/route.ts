import { NextRequest, NextResponse } from "next/server";
import { getAdminByEmail } from "@/lib/db";
import { verifyPassword } from "@/lib/security";
import { createSession } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rateLimit = checkRateLimit(`login_${ip}`, { limit: 6, windowMs: 15 * 60 * 1000 }); // Max 6 attempts per 15 mins
  if (!rateLimit.success) {
    const waitMinutes = Math.ceil((rateLimit.resetAt - Date.now()) / 60000);
    return NextResponse.json(
      { error: `تم تجاوز الحد الأقصى للمحاولات. يرجى المحاولة بعد ${waitMinutes} دقيقة.` },
      { status: 429 }
    );
  }

  const body = await req.json();
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const user = await getAdminByEmail(email);
  if (!user || !verifyPassword(password, user.password)) {
    // Artificial delay to prevent timing attacks
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const session = await createSession(user._id);
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
