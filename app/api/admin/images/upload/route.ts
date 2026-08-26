import { NextRequest, NextResponse } from "next/server";
import { getAuthAdmin } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import sharp from "sharp";
import { Binary } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    const admin = await getAuthAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let inputBuffer: Buffer | null = null;
    let filename = "product-image.webp";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: "حجم الصورة كبير جداً (الحد الأقصى 10 ميجابايت)" }, { status: 400 });
      }
      filename = file.name || filename;
      const arrayBuffer = await file.arrayBuffer();
      inputBuffer = Buffer.from(arrayBuffer);
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      if (body.data && typeof body.data === "string") {
        // Base64 Data URL
        const base64Data = body.data.replace(/^data:image\/\w+;base64,/, "");
        inputBuffer = Buffer.from(base64Data, "base64");
        if (inputBuffer.length > 10 * 1024 * 1024) {
          return NextResponse.json({ error: "حجم الصورة كبير جداً (الحد الأقصى 10 ميجابايت)" }, { status: 400 });
        }
        filename = body.filename || filename;
      }
    }

    if (!inputBuffer || inputBuffer.length === 0) {
      return NextResponse.json({ error: "Invalid image data" }, { status: 400 });
    }

    // High-performance image optimization via Sharp:
    // 1. Resize to max 600x600 px without upscaling
    // 2. Convert to modern WebP format @ 80% quality (reduces size by ~95%)
    const processed = await sharp(inputBuffer)
      .resize({
        width: 600,
        height: 600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 80, effort: 6 })
      .toBuffer({ resolveWithObject: true });

    const optimizedBuffer = processed.data;
    const { width, height, size } = processed.info;

    const db = await getDb();
    const result = await db.collection("images").insertOne({
      filename: filename.replace(/\.[^/.]+$/, "") + ".webp",
      mimeType: "image/webp",
      data: new Binary(optimizedBuffer),
      size: size || optimizedBuffer.length,
      width: width || 600,
      height: height || 600,
      createdAt: new Date(),
    });

    const imageId = result.insertedId.toString();
    const url = `/api/public/images/${imageId}`;

    return NextResponse.json({
      success: true,
      id: imageId,
      url,
      size: size || optimizedBuffer.length,
      width,
      height,
    });
  } catch (error: any) {
    console.error("[Image Upload Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to process and store image" }, { status: 500 });
  }
}
