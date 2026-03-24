import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCategories } from "@/hooks/useProducts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ImageUpload from "@/components/ImageUpload";
import { toast } from "@/hooks/use-toast";

interface EditProductDialogProps {
  product: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const EditProductDialog = ({ product, open, onOpenChange, onSaved }: EditProductDialogProps) => {
  const { data: categories } = useCategories();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", price: "", originalPrice: "", costPrice: "",
    unit: "each", badge: "", description: "", categoryId: "", imageUrl: "",
  });

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || "",
        price: String(product.price ?? ""),
        originalPrice: product.original_price ? String(product.original_price) : "",
        costPrice: product.cost_price ? String(product.cost_price) : "",
        unit: product.unit || "each",
        badge: product.badge || "",
        description: product.description || "",
        categoryId: product.category_id || "",
        imageUrl: product.image_url || "",
      });
    }
  }, [product]);

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      toast({ title: "Missing fields", description: "Name and price are required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("products").update({
        name: form.name,
        price: parseFloat(form.price),
        original_price: form.originalPrice ? parseFloat(form.originalPrice) : null,
        cost_price: form.costPrice ? parseFloat(form.costPrice) : null,
        unit: form.unit || "each",
        badge: form.badge || null,
        description: form.description || null,
        category_id: form.categoryId || null,
        image_url: form.imageUrl || null,
      }).eq("id", product.id);
      if (error) throw error;
      toast({ title: "Product Updated", description: `${form.name} has been updated` });
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Edit Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Product Name *</Label>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <select value={form.categoryId} onChange={(e) => update("categoryId", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="">Select category</option>
              {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Product Image</Label>
            <div className="flex items-start gap-4">
              {form.imageUrl && (
                <img src={form.imageUrl} alt="Current" className="h-20 w-20 rounded-lg border border-border object-cover" />
              )}
              <div className="flex-1">
                <ImageUpload bucket="product-images" onUploaded={(url) => update("imageUrl", url)} currentUrl={form.imageUrl} label="Upload new image" />
              </div>
            </div>
            <Input value={form.imageUrl} onChange={(e) => update("imageUrl", e.target.value)} placeholder="Or paste image URL" className="mt-2" />
          </div>
          <div className="space-y-1.5">
            <Label>Selling Price *</Label>
            <Input type="number" step="0.01" value={form.price} onChange={(e) => update("price", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Original Price</Label>
            <Input type="number" step="0.01" value={form.originalPrice} onChange={(e) => update("originalPrice", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Cost Price</Label>
            <Input type="number" step="0.01" value={form.costPrice} onChange={(e) => update("costPrice", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Unit</Label>
            <Input value={form.unit} onChange={(e) => update("unit", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Badge</Label>
            <Input value={form.badge} onChange={(e) => update("badge", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={form.description} onChange={(e) => update("description", e.target.value)} />
          </div>
          <div className="flex items-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={loading} className="flex-1">{loading ? "Saving…" : "Save Changes"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductDialog;