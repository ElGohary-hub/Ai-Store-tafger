import { NextRequest, NextResponse } from "next/server";
import { getAuthAdmin } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

async function requireAdmin(req: NextRequest) {
  const admin = await getAuthAdmin(req);
  if (!admin) throw new Error("Unauthorized");
  return admin;
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const search = req.nextUrl.searchParams.get("search")?.trim();
    const db = await getDb();

    let query: any = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ],
      };
    }

    const customers = await db.collection("customers").find(query).sort({ last_order_at: -1 }).toArray();

    return NextResponse.json(
      customers.map((c) => ({
        id: c._id.toString(),
        name: c.name || "Anonymous",
        email: c.email || "",
        phone: c.phone || "",
        orders_count: c.orders_count || 0,
        total_spent: c.total_spent || 0,
        last_order_at: c.last_order_at || "",
      }))
    );
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
