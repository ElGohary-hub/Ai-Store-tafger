import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { randomBytes } from "crypto";
import sharp from "sharp";
import { Binary } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const senderPhone = (formData.get("senderPhone") as string)?.trim();
    const customerName = (formData.get("customerName") as string)?.trim() || "عميل إنستاباي / فودافون";
    const productId = (formData.get("productId") as string)?.trim() || "";
    const productName = (formData.get("productName") as string)?.trim() || "";
    const amount = Number(formData.get("amount")) || 0;
    const currency = (formData.get("currency") as string)?.trim() || "ج.م";
    const paymentMethod = (formData.get("paymentMethod") as string)?.trim() || "instapay";
    const receiptFile = formData.get("receiptFile") as File | null;

    if (!senderPhone) {
      return NextResponse.json({ error: "رقم الهاتف المحول منه مطلوب" }, { status: 400 });
    }

    let receiptUrl = "";
    const db = await getDb();

    // If receipt screenshot is uploaded, process with Sharp and store in MongoDB images
    if (receiptFile && receiptFile.size > 0) {
      try {
        const arrayBuffer = await receiptFile.arrayBuffer();
        const inputBuffer = Buffer.from(arrayBuffer);

        // Process image keeping text clear for receipt inspection (max 1200x1200, WebP 85%)
        const processed = await sharp(inputBuffer)
          .resize({
            width: 1200,
            height: 1200,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 85, effort: 5 })
          .toBuffer({ resolveWithObject: true });

        const optimizedBuffer = processed.data;
        const { width, height, size } = processed.info;

        const imgResult = await db.collection("images").insertOne({
          filename: `receipt-${Date.now()}.webp`,
          mimeType: "image/webp",
          data: new Binary(optimizedBuffer),
          size: size || optimizedBuffer.length,
          width: width || 800,
          height: height || 800,
          createdAt: new Date(),
        });

        const imageId = imgResult.insertedId.toString();
        receiptUrl = `/api/public/images/${imageId}`;
      } catch (imgErr) {
        console.error("Failed to process receipt image:", imgErr);
      }
    }

    const orderId = `INSTA-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}`;

    const submission = {
      order_id: orderId,
      customer_name: customerName,
      customer_phone: senderPhone,
      product_id: productId,
      product_name: productName,
      amount,
      currency,
      payment_method: paymentMethod,
      receipt_url: receiptUrl,
      status: "pending",
      created_at: new Date(),
    };

    const result = await db.collection("instapay_payments").insertOne(submission);

    return NextResponse.json({
      success: true,
      orderId,
      id: result.insertedId.toString(),
      receiptUrl,
      message: "تم تسجيل إيصال الدفع بنجاح",
    });
  } catch (error: any) {
    console.error("[InstaPay Submit Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to submit receipt" }, { status: 500 });
  }
}
