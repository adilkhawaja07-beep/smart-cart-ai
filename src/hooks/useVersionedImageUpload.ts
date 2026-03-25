import { useState, useCallback } from "react";
import { ImageVersionService } from "@/lib/services/imageVersionService";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook for uploading images with version tracking
 * Extends basic image upload with automatic version recording
 */

export interface UseVersionedImageUploadOptions {
  bucket: string;
  productId?: string;
  categoryId?: string;
  recordVersions?: boolean; // Enable version tracking (default: true)
  onUploaded?: (url: string) => void;
  onError?: (error: Error) => void;
}

export function useVersionedImageUpload(
  options: UseVersionedImageUploadOptions
) {
  const {
    bucket,
    productId,
    categoryId,
    recordVersions = true,
    onUploaded,
    onError,
  } = options;

  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<number | null>(null);
  const [versionHistory, setVersionHistory] = useState<any[]>([]);

  /**
   * Record image version in database
   */
  const recordVersion = useCallback(
    async (
      publicUrl: string,
      storagePath: string,
      fileSize?: number,
      fileMimeType?: string,
      fileHash?: string
    ) => {
      if (!recordVersions || (!productId && !categoryId)) {
        return;
      }

      try {
        const version = await ImageVersionService.recordImageVersion(
          publicUrl,
          storagePath,
          {
            productId,
            categoryId,
            fileSize,
            fileMimeType,
            fileHash,
          }
        );

        setCurrentVersion(version.version_number);

        // Fetch updated history
        const history = await ImageVersionService.getImageHistory(
          { productId, categoryId },
          5 // Keep last 5 versions in memory
        );
        setVersionHistory(history);

        return version;
      } catch (err: any) {
        console.error("Failed to record image version:", err);
        // Don't fail the upload, just skip version recording
      }
    },
    [productId, categoryId, recordVersions]
  );

  /**
   * Rollback to a previous version
   */
  const rollback = useCallback(
    async (versionId: string) => {
      if (!productId && !categoryId) {
        throw new Error("productId or categoryId required for rollback");
      }

      try {
        const version = await ImageVersionService.rollbackImageVersion(versionId, {
          productId,
          categoryId,
        });

        setCurrentVersion(version.version_number);

        // Refetch history
        const history = await ImageVersionService.getImageHistory(
          { productId, categoryId },
          5
        );
        setVersionHistory(history);

        toast({
          title: "Image Rolled Back",
          description: `Restored version ${version.version_number}`,
        });

        onUploaded?.(version.public_url);
        return version;
      } catch (err: any) {
        const error = new Error(`Rollback failed: ${err.message}`);
        onError?.(error);
        toast({
          title: "Rollback Failed",
          description: err.message,
          variant: "destructive",
        });
        throw error;
      }
    },
    [productId, categoryId, onUploaded, onError, toast]
  );

  /**
   * Get current version number
   */
  const getCurrentVersion = useCallback(
    async (): Promise<number | null> => {
      if (!productId && !categoryId) {
        return null;
      }

      try {
        const version = await ImageVersionService.getCurrentImageVersion({
          productId,
          categoryId,
        });
        return version?.version_number || null;
      } catch (err) {
        console.error("Failed to get current version:", err);
        return null;
      }
    },
    [productId, categoryId]
  );

  /**
   * Get image history
   */
  const getHistory = useCallback(
    async (limit = 10) => {
      if (!productId && !categoryId) {
        return [];
      }

      try {
        const history = await ImageVersionService.getImageHistory(
          { productId, categoryId },
          limit
        );
        setVersionHistory(history);
        return history;
      } catch (err: any) {
        console.error("Failed to get image history:", err);
        return [];
      }
    },
    [productId, categoryId]
  );

  /**
   * Get version statistics
   */
  const getStats = useCallback(async () => {
    if (!productId && !categoryId) {
      return null;
    }

    try {
      const stats = await ImageVersionService.getImageVersionStats({
        productId,
        categoryId,
      });
      return stats;
    } catch (err: any) {
      console.error("Failed to get version stats:", err);
      return null;
    }
  }, [productId, categoryId]);

  return {
    uploading,
    setUploading,
    currentVersion,
    versionHistory,
    recordVersion,
    rollback,
    getCurrentVersion,
    getHistory,
    getStats,
  };
}
