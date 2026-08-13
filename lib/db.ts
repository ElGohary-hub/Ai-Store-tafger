import { getDb } from "./mongodb";
import { ObjectId } from "mongodb";

export async function getAdminByEmail(email: string) {
  const db = await getDb();
  return await db.collection("admins").findOne({ email });
}

export async function createAdmin(email: string, password: string, role = "super-admin") {
  const db = await getDb();
  return await db.collection("admins").insertOne({
    email,
    password,
    role,
    createdAt: new Date(),
  });
}

export async function getCollection(name: string) {
  const db = await getDb();
  return db.collection(name);
}

export { getDb, ObjectId };
