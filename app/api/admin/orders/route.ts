import { NextRequest, NextResponse } from "next/server";
import { getAuthAdmin } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

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
      const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const safeSearch = escapeRegex(search);
      query = {
        $or: [
          { customer_name: { $regex: safeSearch, $options: "i" } },
          { customer_email: { $regex: safeSearch, $options: "i" } },
          { customer_phone: { $regex: safeSearch, $options: "i" } },
        ],
      };
    }

    const orders = await db.collection("orders").find(query).sort({ created_at: -1, _id: -1 }).toArray();

    return NextResponse.json(
      orders.map((o) => ({
        id: o._id.toString(),
        customer_name: o.customer_name || "Guest",
        customer_email: o.customer_email || "",
        customer_phone: o.customer_phone || "",
        status: o.status || "pending",
        total: Math.round(Number(o.total || 0) * 100) / 100,
        metadata: o.metadata || "",
        created_at: o.created_at || new Date().toISOString(),
      }))
    );
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const { id, status } = body;
    if (!id || !status) {
      return NextResponse.json({ error: "ID and status are required." }, { status: 400 });
    }

    const db = await getDb();
    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    await db.collection("orders").updateOne(query, { $set: { status, updatedAt: new Date() } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const { id, clearAll } = body;

    const db = await getDb();

    if (clearAll) {
      await db.collection("orders").deleteMany({});
      return NextResponse.json({ success: true, message: "All orders deleted" });
    }

    if (!id) {
      return NextResponse.json({ error: "Order ID is required." }, { status: 400 });
    }

    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    const result = await db.collection("orders").deleteOne(query);

    return NextResponse.json({ success: true, deletedCount: result.deletedCount });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
