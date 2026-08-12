import { createToken } from "./security";
import db from "./db";

export function createSession(adminId: number) {
  const token = createToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare("INSERT INTO sessions (admin_id, token, expires_at) VALUES (?, ?, ?)").run(adminId, token, expiresAt);
  return { token, expiresAt };
}

export function getSession(token: string | undefined) {
  if (!token) return null;
  return db
    .prepare("SELECT * FROM sessions WHERE token = ? AND expires_at > datetime('now')")
    .get(token);
}

export function getAdminBySessionToken(token: string | undefined) {
  const session = getSession(token);
  if (!session) return null;
  return db.prepare("SELECT id, email, role FROM admins WHERE id = ?").get(session.admin_id);
}

export function revokeSession(token: string | undefined) {
  if (!token) return null;
  return db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}
