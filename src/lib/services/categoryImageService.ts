import { supabase } from "@/integrations/supabase/client";

/**
 * Service for managing category images in Supabase storage
 * Handles uploading category images and retrieving public URLs
 */

export const CATEGORY_IMAGE_CONFIG = {
  bucket: "category-images",
  maxSize: 5 * 1024 * 1024, // 5MB
  timeout: 60000, // 60 seconds
  acceptedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
} as const;

export interface CategoryImage {
  categoryId: string;
  categoryName: string;
  publicUrl: string;
  uploadDate: string;
  fileSize?: number;
}

export class CategoryImageService {
  /**
   * Upload a category image to Supabase storage
   * @param file - Image file to upload
   * @param categoryId - ID of the category
   * @param categoryName - Name of the category for friendly filename
   * @returns Public URL of the uploaded image
   */
  static async uploadCategoryImage(
    file: File,
    categoryId: string,
    categoryName: string
  ): Promise<string> {
    // Validate file
    this.validateFile(file);

    // Generate filename
    const ext = file.name.split(".").pop();
    const cleanName = categoryName.toLowerCase().replace(/\s+/g, "-");
    const fileName = `${cleanName}-${categoryId}.${ext}`;

    try {
      // Upload with timeout
      const uploadResult = await Promise.race([
        supabase.storage
          .from(CATEGORY_IMAGE_CONFIG.bucket)
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: true, // Replace if exists
          }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Upload timed out")),
            CATEGORY_IMAGE_CONFIG.timeout
          )
        ),
      ]);

      if (uploadResult.error) {
        throw uploadResult.error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(CATEGORY_IMAGE_CONFIG.bucket)
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (err: any) {
      console.error("Category image upload error:", err);
      throw new Error(`Failed to upload category image: ${err.message}`);
    }
  }

  /**
   * Delete a category image from storage
   * @param publicUrl - Public URL of the image to delete
   * @returns true if deletion was successful
   */
  static async deleteCategoryImage(publicUrl: string): Promise<boolean> {
    try {
      // Extract filename from URL
      const url = new URL(publicUrl);
      const fileName = url.pathname.split("/").pop();

      if (!fileName) {
        throw new Error("Could not extract filename from URL");
      }

      const { error } = await supabase.storage
        .from(CATEGORY_IMAGE_CONFIG.bucket)
        .remove([fileName]);

      if (error) {
        throw error;
      }

      return true;
    } catch (err: any) {
      console.error("Category image deletion error:", err);
      return false;
    }
  }

  /**
   * Update a category's image in the database
   * @param categoryId - ID of the category
   * @param publicUrl - Public URL of the new image
   * @returns Updated category record
   */
  static async updateCategoryImageUrl(
    categoryId: string,
    publicUrl: string
  ): Promise<any> {
    try {
      const { data, error } = await supabase
        .from("categories")
        .update({ image_url: publicUrl })
        .eq("id", categoryId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (err: any) {
      console.error("Category image URL update error:", err);
      throw new Error(
        `Failed to update category image URL: ${err.message}`
      );
    }
  }

  /**
   * Get a category's current image URL from database
   * @param categoryId - ID of the category
   * @returns Image URL or null if not set
   */
  static async getCategoryImageUrl(categoryId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("image_url")
        .eq("id", categoryId)
        .single();

      if (error) {
        throw error;
      }

      return data?.image_url || null;
    } catch (err: any) {
      console.error("Category image URL fetch error:", err);
      return null;
    }
  }

  /**
   * Upload and update category image in one operation
   * @param file - Image file to upload
   * @param categoryId - ID of the category
   * @param categoryName - Name of the category
   * @returns Updated category record
   */
  static async uploadAndUpdateCategoryImage(
    file: File,
    categoryId: string,
    categoryName: string
  ): Promise<any> {
    // Upload the image
    const publicUrl = await this.uploadCategoryImage(
      file,
      categoryId,
      categoryName
    );

    // Update the database
    const updatedCategory = await this.updateCategoryImageUrl(
      categoryId,
      publicUrl
    );

    return updatedCategory;
  }

  /**
   * Validate uploaded file
   * @param file - File to validate
   * @throws Error if file is invalid
   */
  private static validateFile(file: File): void {
    // Check file size
    if (file.size > CATEGORY_IMAGE_CONFIG.maxSize) {
      throw new Error(
        `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds maximum of ${CATEGORY_IMAGE_CONFIG.maxSize / 1024 / 1024}MB`
      );
    }

    // Check file type
    if (!CATEGORY_IMAGE_CONFIG.acceptedTypes.includes(file.type)) {
      throw new Error(
        `File type ${file.type} is not supported. Supported types: JPEG, PNG, WebP, GIF`
      );
    }
  }

  /**
   * Get list of all category images in storage (for diagnostic purposes)
   * @returns Array of files in category-images bucket
   */
  static async listCategoryImages(): Promise<any[]> {
    try {
      const { data, error } = await supabase.storage
        .from(CATEGORY_IMAGE_CONFIG.bucket)
        .list("", { limit: 100 });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (err: any) {
      console.error("List category images error:", err);
      return [];
    }
  }
}
