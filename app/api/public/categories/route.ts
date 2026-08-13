import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const categories = await db
      .collection("categories")
      .find({ visible: { $ne: 0 } })
      .sort({ sort_order: 1, _id: 1 })
      .toArray();

    return NextResponse.json(
      categories.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        slug: c.slug,
        image: c.image,
        visible: c.visible,
        sort_order: c.sort_order,
      }))
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
