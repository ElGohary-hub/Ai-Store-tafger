import { createToken } from "./security";
import { getDb } from "./mongodb";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";

export async function createSession(adminId: string | ObjectId) {
  const db = await getDb();
  const token = createToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.collection("sessions").insertOne({
    adminId: adminId.toString(),
    token,
    expiresAt,
    createdAt: new Date(),
  });
  return { token, expiresAt: expiresAt.toISOString() };
}

export async function getSession(token: string | undefined) {
  if (!token) return null;
  const db = await getDb();
  return await db.collection("sessions").findOne({
    token,
    expiresAt: { $gt: new Date() },
  });
}

export async function getAdminBySessionToken(token: string | undefined) {
  const session = await getSession(token);
  if (!session) return null;
  const db = await getDb();
  try {
    return await db.collection("admins").findOne(
      { _id: new ObjectId(session.adminId) },
      { projection: { password: 0 } }
    );
  } catch {
    return null;
  }
}

export async function getAuthAdmin(req?: NextRequest) {
  let token = req?.cookies?.get?.("cms_token")?.value;
  if (!token) {
    try {
      token = (await cookies()).get("cms_token")?.value;
    } catch {}
  }
  return await getAdminBySessionToken(token);
}

export async function revokeSession(token: string | undefined) {
  if (!token) return null;
  const db = await getDb();
  return await db.collection("sessions").deleteOne({ token });
}
