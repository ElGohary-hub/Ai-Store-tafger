import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64);
  return `${salt}:${derived.toString("hex")}`;
}

export function verifyPassword(password: string, hashed: string): boolean {
  if (!hashed) return false;

  // Support bcrypt hashes (legacy format from initial seeding)
  if (hashed.startsWith("$2b$") || hashed.startsWith("$2a$")) {
    return bcrypt.compareSync(password, hashed);
  }

  // Support scrypt format: salt:hex
  const parts = hashed.split(":");
  if (parts.length !== 2) return false;
  const [salt, key] = parts;
  if (!salt || !key) return false;

  try {
    const derived = scryptSync(password, salt, 64);
    return timingSafeEqual(Buffer.from(key, "hex"), derived);
  } catch {
    return false;
  }
}

export function createToken() {
  return randomBytes(32).toString("hex");
}
