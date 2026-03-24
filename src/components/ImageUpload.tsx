import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ImageUploadProps {
  bucket: string;
  onUploaded: (url: string) => void;
  currentUrl?: string;
  label?: string;
}

const ImageUpload = ({ bucket, onUploaded, currentUrl, label = "Upload Image" }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage.from(bucket).upload(fileName, file);
      if (error) throw error;

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
      setPreview(urlData.publicUrl);
      onUploaded(urlData.publicUrl);
      toast({ title: "Image uploaded", description: "Image uploaded successfully" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setPreview(null);
    onUploaded("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative inline-block">
          <img src={preview} alt="Preview" className="h-24 w-24 rounded-lg border border-border object-cover" />
          <button
            type="button"
            onClick={handleClear}
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          className="flex h-24 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/50"
        >
          {uploading ? (
            <span className="text-xs">Uploading…</span>
          ) : (
            <>
              <ImageIcon className="h-6 w-6" />
              <span className="text-xs">{label}</span>
            </>
          )}
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
    </div>
  );
};

export default ImageUpload;
