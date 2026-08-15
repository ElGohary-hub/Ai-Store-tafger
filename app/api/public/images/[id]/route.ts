import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || !ObjectId.isValid(id)) {
      return new NextResponse("Invalid image ID", { status: 400 });
    }

    const db = await getDb();
    const imageDoc = await db.collection("images").findOne({ _id: new ObjectId(id) });

    if (!imageDoc || !imageDoc.data) {
      return new NextResponse("Image not found", { status: 404 });
    }

    // Extract binary buffer
    const buffer = Buffer.isBuffer(imageDoc.data)
      ? imageDoc.data
      : imageDoc.data.buffer
      ? Buffer.from(imageDoc.data.buffer)
      : Buffer.from(imageDoc.data);

    const mimeType = imageDoc.mimeType || "image/webp";
    const etag = `"${imageDoc._id.toString()}-${imageDoc.updatedAt ? new Date(imageDoc.updatedAt).getTime() : 1}"`;

    // Check If-None-Match header for client caching (304 Not Modified)
    const ifNoneMatch = req.headers.get("if-none-match");
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 });
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
        ETag: etag,
      },
    });
  } catch (error: any) {
    console.error("[Image API] Error serving image:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
