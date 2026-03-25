import { supabase } from "@/integrations/supabase/client";

/**
 * This script checks product images and fixes URLs
 * Run this in browser console or as part of your app
 */

export async function checkProductImages() {
  console.log("🔍 Checking product images in database...");

  try {
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, image_url, categories(name)")
      .limit(10);

    if (error) throw error;

    console.log("📊 Products check:");
    products?.forEach((p) => {
      console.log(`- ${p.name}: ${p.image_url || "❌ NO IMAGE URL"}`);
    });

    // Check storage bucket
    const { data: files, error: storageError } = await supabase.storage
      .from("product-images")
      .list("", { limit: 100 });

    if (storageError) throw storageError;

    console.log("\n📁 Files in product-images bucket:");
    files?.slice(0, 10).forEach((f) => {
      console.log(`- ${f.name}`);
    });

    console.log(
      `\n✅ Total files in storage: ${files?.length || 0}`,
      files?.length === 0
        ? "\n⚠️  No files in storage! You need to re-upload images."
        : ""
    );

    return { products, files };
  } catch (err) {
    console.error("❌ Error checking images:", err);
  }
}

/**
 * Fix image URLs for products
 * This matches products with files in storage and updates their URLs
 */
export async function fixProductImageUrls() {
  console.log("🔧 Fixing product image URLs...");

  try {
    // Get all products
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*");

    if (productsError) throw productsError;

    // Get all files in storage
    const { data: files, error: filesError } = await supabase.storage
      .from("product-images")
      .list("", { limit: 1000 });

    if (filesError) throw filesError;

    console.log(`Found ${products?.length || 0} products and ${files?.length || 0} files`);

    // Get base URL for storage
    const {
      data: { publicUrl },
    } = supabase.storage.from("product-images").getPublicUrl("temp.jpg");
    const baseUrl = publicUrl.replace("/temp.jpg", "");

    console.log(`Storage base URL: ${baseUrl}`);

    // Try to match products with files
    let updated = 0;
    for (const product of products || []) {
      if (!product.image_url && files && files.length > 0) {
        // Try to find a matching file (you may need to adjust matching logic)
        const matchedFile = files.find(
          (f) =>
            f.name.toLowerCase().includes(product.name.toLowerCase().split(" ")[0]) ||
            f.name.toLowerCase().includes(product.id)
        );

        if (matchedFile) {
          const newUrl = `${baseUrl}/${matchedFile.name}`;
          const { error: updateError } = await supabase
            .from("products")
            .update({ image_url: newUrl })
            .eq("id", product.id);

          if (updateError) {
            console.error(`Failed to update ${product.name}:`, updateError);
          } else {
            console.log(`✅ Updated ${product.name} → ${matchedFile.name}`);
            updated++;
          }
        }
      }
    }

    console.log(`\n✅ Updated ${updated} product image URLs`);

    if (updated === 0) {
      console.warn(
        "\n⚠️  No updates made. You may need to re-upload images or match them manually."
      );
    }
  } catch (err) {
    console.error("❌ Error fixing image URLs:", err);
  }
}

// Run diagnostic
checkProductImages();
