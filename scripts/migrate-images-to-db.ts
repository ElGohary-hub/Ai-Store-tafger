import { getDb } from "../lib/mongodb";
import sharp from "sharp";
import { Binary, ObjectId } from "mongodb";
import fs from "fs";
import path from "path";

async function runMigration() {
  console.log("==================================================");
  console.log(" Starting Product Image Migration to MongoDB...");
  console.log("==================================================");

  const db = await getDb();
  const products = await db.collection("products").find({}).toArray();
  console.log(`Found ${products.length} products in database.\n`);

  let migratedCount = 0;
  let totalOriginalBytes = 0;
  let totalOptimizedBytes = 0;

  for (const product of products) {
    const rawImage = (product.image || "").trim();
    if (!rawImage) {
      console.log(`[Skip] Product "${product.name}" has no image.`);
      continue;
    }

    // If already stored in DB via /api/public/images/
    if (rawImage.startsWith("/api/public/images/")) {
      console.log(`[OK] Product "${product.name}" already uses DB image: ${rawImage}`);
      continue;
    }

    // Try finding local file in public folder
    let relativePath = rawImage.replace(/^\/+/, ""); // strip leading slash
    if (relativePath.startsWith("public/")) {
      relativePath = relativePath.replace(/^public\//, "");
    }

    const publicPath = path.join(process.cwd(), "public", relativePath);

    if (fs.existsSync(publicPath)) {
      try {
        const originalBuffer = fs.readFileSync(publicPath);
        const originalSize = originalBuffer.length;
        totalOriginalBytes += originalSize;

        // Optimize with Sharp: 600x600 WebP
        const processed = await sharp(originalBuffer)
          .resize({ width: 600, height: 600, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 80, effort: 6 })
          .toBuffer({ resolveWithObject: true });

        const optimizedBuffer = processed.data;
        const optimizedSize = processed.info.size;
        totalOptimizedBytes += optimizedSize;

        // Insert into MongoDB images collection
        const insertRes = await db.collection("images").insertOne({
          filename: path.basename(publicPath, path.extname(publicPath)) + ".webp",
          mimeType: "image/webp",
          data: new Binary(optimizedBuffer),
          size: optimizedSize,
          width: processed.info.width,
          height: processed.info.height,
          productId: product._id,
          createdAt: new Date(),
        });

        const newImageUrl = `/api/public/images/${insertRes.insertedId.toString()}`;

        // Update product in DB
        await db.collection("products").updateOne(
          { _id: product._id },
          { $set: { image: newImageUrl, updatedAt: new Date() } }
        );

        const savings = (((originalSize - optimizedSize) / originalSize) * 100).toFixed(1);
        console.log(
          `✓ Migrated "${product.name}": ${(originalSize / 1024).toFixed(1)} KB -> ${(optimizedSize / 1024).toFixed(1)} KB WebP (-${savings}%) -> ${newImageUrl}`
        );
        migratedCount++;
      } catch (err: any) {
        console.error(`[Error] Failed to migrate image for "${product.name}":`, err.message);
      }
    } else {
      console.warn(`[Warning] Local image file not found on disk: ${publicPath} (Product: ${product.name})`);
    }
  }

  console.log("\n==================================================");
  console.log(` Migration Completed!`);
  console.log(` Migrated Products: ${migratedCount} / ${products.length}`);
  console.log(` Original Disk Size: ${(totalOriginalBytes / 1024).toFixed(1)} KB`);
  console.log(` Compressed DB Size: ${(totalOptimizedBytes / 1024).toFixed(1)} KB`);
  if (totalOriginalBytes > 0) {
    const totalSavings = (((totalOriginalBytes - totalOptimizedBytes) / totalOriginalBytes) * 100).toFixed(1);
    console.log(` Total Storage Saved: ${totalSavings}%!`);
  }
  console.log("==================================================");
  process.exit(0);
}

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
