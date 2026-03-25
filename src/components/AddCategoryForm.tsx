import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CategoryRepository } from "@/lib/repositories/productRepository";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { FolderPlus } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";

interface AddCategoryFormProps {
  onCategoryAdded?: () => void;
}

const AddCategoryForm = ({ onCategoryAdded }: AddCategoryFormProps) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Missing name", description: "Category name is required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await CategoryRepository.createCategory({
        name: name.trim(),
        description: description.trim() || null,
        image_url: imageUrl || null,
      });
      
      // Invalidate categories cache
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      
      toast({ title: "Category Added", description: `${name} has been created` });
      setName("");
      setDescription("");
      setImageUrl("");
      onCategoryAdded?.();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderPlus className="h-5 w-5" /> Add New Category
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Category Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Organic Produce" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" />
          </div>
          <div className="space-y-1.5">
            <Label>Category Image</Label>
            <ImageUpload bucket="category-images" onUploaded={setImageUrl} currentUrl={imageUrl} label="Upload category image" />
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Or paste image URL"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Adding…" : "Add Category"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddCategoryForm;
