import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * useImageUpload - handles image upload logic
 * Separates upload concerns from UI
 */
export interface UseImageUploadOptions {
  bucket: string;
  maxSize?: number;
  timeout?: number;
}

export function useImageUpload(options: UseImageUploadOptions) {
  const { bucket, maxSize = 5 * 1024 * 1024, timeout = 60000 } = options;
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      if (!file.type.startsWith("image/")) {
        return { valid: false, error: "Please select an image file" };
      }

      if (file.size > maxSize) {
        return {
          valid: false,
          error: `Image must be less than ${maxSize / 1024 / 1024}MB`,
        };
      }

      return { valid: true };
    },
    [maxSize]
  );

  const uploadFile = useCallback(
    async (file: File): Promise<string> => {
      const validation = validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      setUploading(true);
      try {
        const ext = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const uploadResult = await Promise.race([
          supabase.storage.from(bucket).upload(fileName, file),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("Upload timed out. Please try again.")),
              timeout
            )
          ),
        ]);

        const { error } = uploadResult;
        if (error) throw error;

        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
        const publicUrl = urlData.publicUrl;

        setPreview(publicUrl);
        return publicUrl;
      } finally {
        setUploading(false);
      }
    },
    [bucket, validateFile, timeout]
  );

  const clearPreview = useCallback(() => {
    setPreview(null);
  }, []);

  const setCurrentPreview = useCallback((url: string | null) => {
    setPreview(url);
  }, []);

  return {
    uploading,
    preview,
    uploadFile,
    clearPreview,
    setCurrentPreview,
    validateFile,
  };
}
