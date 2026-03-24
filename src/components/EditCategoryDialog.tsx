import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ImageUpload from "@/components/ImageUpload";
import { toast } from "@/hooks/use-toast";

interface EditCategoryDialogProps {
  category: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const EditCategoryDialog = ({ category, open, onOpenChange, onSaved }: EditCategoryDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (category) {
      setName(category.name || "");
      setDescription(category.description || "");
      setImageUrl(category.image_url || "");
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Missing name", description: "Category name is required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("categories").update({
        name: name.trim(),
        description: description.trim() || null,
        image_url: imageUrl || null,
      }).eq("id", category.id);
      if (error) throw error;
      toast({ title: "Category Updated", description: `${name} has been updated` });
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Edit Category</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Category Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Category Image</Label>
            <div className="flex items-start gap-4">
              {imageUrl && (
                <img src={imageUrl} alt="Current" className="h-20 w-20 rounded-lg border border-border object-cover" />
              )}
              <div className="flex-1">
                <ImageUpload bucket="category-images" onUploaded={setImageUrl} currentUrl={imageUrl} label="Upload new image" />
              </div>
            </div>
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Or paste image URL" className="mt-2" />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={loading} className="flex-1">{loading ? "Saving…" : "Save Changes"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCategoryDialog;