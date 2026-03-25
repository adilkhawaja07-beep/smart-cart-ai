import { supabase } from "@/integrations/supabase/client";

/**
 * Service for managing image versions and history
 * Provides version tracking, rollback, and audit trails
 */

export interface ImageVersion {
  id: string;
  product_id?: string | null;
  category_id?: string | null;
  storage_path: string;
  public_url: string;
  version_number: number;
  file_hash?: string | null;
  file_size?: number | null;
  file_mime_type?: string | null;
  uploaded_by?: string | null;
  uploaded_at: string;
  is_current: boolean;
  is_deleted: boolean;
}

export interface ImageVersionHistory {
  product_id?: string;
  category_id?: string;
  versions: ImageVersion[];
  current?: ImageVersion;
}

export class ImageVersionService {
  /**
   * Record a new image version after upload
   * Automatically marks previous version as not current
   * @param publicUrl - Public URL of the uploaded image
   * @param storagePath - Path in storage bucket (e.g., "product-images/file.jpg")
   * @param productId - Product ID (if uploading product image)
   * @param categoryId - Category ID (if uploading category image)
   * @param fileHash - Optional SHA-256 hash of file
   * @param fileSize - File size in bytes
   * @param fileMimeType - MIME type (image/jpeg, etc.)
   * @returns Created image version record
   */
  static async recordImageVersion(
    publicUrl: string,
    storagePath: string,
    {
      productId,
      categoryId,
      fileHash,
      fileSize,
      fileMimeType,
      uploadedBy,
    }: {
      productId?: string;
      categoryId?: string;
      fileHash?: string;
      fileSize?: number;
      fileMimeType?: string;
      uploadedBy?: string;
    }
  ): Promise<ImageVersion> {
    if (!productId && !categoryId) {
      throw new Error("Either productId or categoryId must be provided");
    }

    // Get next version number
    const { data: existing, error: fetchError } = await supabase
      .from("image_versions")
      .select("version_number")
      .eq(productId ? "product_id" : "category_id", productId || categoryId)
      .order("version_number", { ascending: false })
      .limit(1);

    if (fetchError) throw fetchError;

    const nextVersion = ((existing?.[0]?.version_number) || 0) + 1;

    // Mark previous version as not current
    const { error: updateError } = await supabase
      .from("image_versions")
      .update({ is_current: false })
      .eq(productId ? "product_id" : "category_id", productId || categoryId)
      .eq("is_current", true);

    if (updateError) throw updateError;

    // Create new version record
    const { data, error: insertError } = await supabase
      .from("image_versions")
      .insert({
        product_id: productId,
        category_id: categoryId,
        storage_path: storagePath,
        public_url: publicUrl,
        version_number: nextVersion,
        file_hash: fileHash,
        file_size: fileSize,
        file_mime_type: fileMimeType,
        uploaded_by: uploadedBy,
        is_current: true,
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return data as ImageVersion;
  }

  /**
   * Get all versions of a product/category image
   * @param productId - Product ID (if fetching product image versions)
   * @param categoryId - Category ID (if fetching category image versions)
   * @param limit - Maximum number of versions to return (default: 20)
   * @returns Array of image versions, newest first
   */
  static async getImageHistory(
    {
      productId,
      categoryId,
    }: { productId?: string; categoryId?: string },
    limit = 20
  ): Promise<ImageVersion[]> {
    if (!productId && !categoryId) {
      throw new Error("Either productId or categoryId must be provided");
    }

    const { data, error } = await supabase
      .from("image_versions")
      .select("*")
      .eq(productId ? "product_id" : "category_id", productId || categoryId)
      .eq("is_deleted", false)
      .order("version_number", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as ImageVersion[];
  }

  /**
   * Get the current active image version
   * @param productId - Product ID
   * @param categoryId - Category ID
   * @returns Current image version or null if none exists
   */
  static async getCurrentImageVersion(
    { productId, categoryId }: { productId?: string; categoryId?: string }
  ): Promise<ImageVersion | null> {
    if (!productId && !categoryId) {
      throw new Error("Either productId or categoryId must be provided");
    }

    const { data, error } = await supabase
      .from("image_versions")
      .select("*")
      .eq(productId ? "product_id" : "category_id", productId || categoryId)
      .eq("is_current", true)
      .eq("is_deleted", false)
      .single();

    if (error?.code === "PGRST116") {
      // No rows found
      return null;
    }

    if (error) throw error;
    return (data as ImageVersion) || null;
  }

  /**
   * Rollback to a previous image version
   * Updates the product/category to use the specified version's URL
   * Marks the previous current version as not current
   * @param imageVersionId - ID of the version to restore
   * @param productId - Product ID (if rolling back product image)
   * @param categoryId - Category ID (if rolling back category image)
   * @returns Updated version record
   */
  static async rollbackImageVersion(
    imageVersionId: string,
    { productId, categoryId }: { productId?: string; categoryId?: string }
  ): Promise<ImageVersion> {
    if (!productId && !categoryId) {
      throw new Error("Either productId or categoryId must be provided");
    }

    // Get the version to restore
    const { data: versionToRestore, error: fetchError } = await supabase
      .from("image_versions")
      .select("id, public_url, version_number")
      .eq("id", imageVersionId)
      .single();

    if (fetchError) throw fetchError;
    if (!versionToRestore) throw new Error("Version not found");

    // Update product/category to use this version's URL
    const { error: updateProductError } = await supabase
      .from(productId ? "products" : "categories")
      .update({ image_url: versionToRestore.public_url })
      .eq("id", productId || categoryId);

    if (updateProductError) throw updateProductError;

    // Mark all versions as not current for this product/category
    const { error: markNotCurrentError } = await supabase
      .from("image_versions")
      .update({ is_current: false })
      .eq(productId ? "product_id" : "category_id", productId || categoryId);

    if (markNotCurrentError) throw markNotCurrentError;

    // Mark the restored version as current
    const { data, error: markCurrentError } = await supabase
      .from("image_versions")
      .update({ is_current: true })
      .eq("id", imageVersionId)
      .select()
      .single();

    if (markCurrentError) throw markCurrentError;
    return data as ImageVersion;
  }

  /**
   * Delete an image version (soft delete)
   * @param imageVersionId - ID of the version to delete
   * @returns Updated version record
   */
  static async deleteImageVersion(imageVersionId: string): Promise<ImageVersion> {
    const { data, error } = await supabase
      .from("image_versions")
      .update({ is_deleted: true })
      .eq("id", imageVersionId)
      .select()
      .single();

    if (error) throw error;
    return data as ImageVersion;
  }

  /**
   * Get image version statistics for a product/category
   * @param productId - Product ID
   * @param categoryId - Category ID
   * @returns Statistics about image versions
   */
  static async getImageVersionStats(
    { productId, categoryId }: { productId?: string; categoryId?: string }
  ): Promise<{
    totalVersions: number;
    currentVersion: number;
    oldestVersion: string | null;
    newestVersion: string | null;
    totalStorage: number; // Total size of all versions in bytes
  }> {
    if (!productId && !categoryId) {
      throw new Error("Either productId or categoryId must be provided");
    }

    const { data, error } = await supabase
      .from("image_versions")
      .select("version_number, file_size, uploaded_at, is_current")
      .eq(productId ? "product_id" : "category_id", productId || categoryId)
      .eq("is_deleted", false);

    if (error) throw error;

    const versions = data || [];
    const currentVersion = versions.find((v) => v.is_current)?.version_number || 0;
    const totalStorage = versions.reduce((sum, v) => sum + (v.file_size || 0), 0);
    const uploadedDates = versions
      .map((v) => v.uploaded_at)
      .sort();

    return {
      totalVersions: versions.length,
      currentVersion,
      oldestVersion: uploadedDates[0] || null,
      newestVersion: uploadedDates[uploadedDates.length - 1] || null,
      totalStorage,
    };
  }

  /**
   * Permanently delete all versions of an image from storage
   * Use with caution - this is irreversible!
   * @param productId - Product ID
   * @param categoryId - Category ID
   * @param bucket - Storage bucket ("product-images" or "category-images")
   * @returns Number of files deleted
   */
  static async deleteAllImageVersionsFromStorage(
    { productId, categoryId }: { productId?: string; categoryId?: string },
    bucket: string
  ): Promise<number> {
    if (!productId && !categoryId) {
      throw new Error("Either productId or categoryId must be provided");
    }

    // Get all versions
    const { data: versions, error: fetchError } = await supabase
      .from("image_versions")
      .select("storage_path")
      .eq(productId ? "product_id" : "category_id", productId || categoryId);

    if (fetchError) throw fetchError;

    if (!versions || versions.length === 0) {
      return 0;
    }

    // Extract filenames from storage paths
    const filenames = versions
      .map((v) => v.storage_path)
      .map((path) => path.split("/").pop())
      .filter(Boolean) as string[];

    if (filenames.length === 0) {
      return 0;
    }

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from(bucket)
      .remove(filenames);

    if (deleteError) throw deleteError;

    // Mark all versions as deleted in database
    await supabase
      .from("image_versions")
      .update({ is_deleted: true })
      .eq(productId ? "product_id" : "category_id", productId || categoryId);

    return filenames.length;
  }

  /**
   * Compare two image versions
   * @param versionId1 - ID of first version
   * @param versionId2 - ID of second version
   * @returns Comparison object
   */
  static async compareImageVersions(
    versionId1: string,
    versionId2: string
  ): Promise<{
    version1: ImageVersion;
    version2: ImageVersion;
    sizeChange: number; // Bytes difference
    sameMimeType: boolean;
  }> {
    const v1 = await supabase
      .from("image_versions")
      .select("*")
      .eq("id", versionId1)
      .single();

    const v2 = await supabase
      .from("image_versions")
      .select("*")
      .eq("id", versionId2)
      .single();

    if (v1.error) throw v1.error;
    if (v2.error) throw v2.error;

    const version1 = v1.data as ImageVersion;
    const version2 = v2.data as ImageVersion;

    return {
      version1,
      version2,
      sizeChange: (version2.file_size || 0) - (version1.file_size || 0),
      sameMimeType: version1.file_mime_type === version2.file_mime_type,
    };
  }
}
