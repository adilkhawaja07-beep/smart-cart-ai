import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCategories } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";

interface AddProductFormProps {
  onProductAdded?: () => void;
}

const AddProductForm = ({ onProductAdded }: AddProductFormProps) => {
  const { data: categories } = useCategories();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [form, setForm] = useState({
    name: "", price: "", originalPrice: "", costPrice: "",
    unit: "each", badge: "", description: "", categoryId: "",
    initialStock: "30", reorderLevel: "10",
  });

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      toast({ title: "Missing fields", description: "Name and price are required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data: product, error: pErr } = await supabase.from("products").insert({
        name: form.name,
        price: parseFloat(form.price),
        original_price: form.originalPrice ? parseFloat(form.originalPrice) : null,
        cost_price: form.costPrice ? parseFloat(form.costPrice) : null,
        unit: form.unit || "each",
        badge: form.badge || null,
        description: form.description || null,
        category_id: form.categoryId || null,
        image_url: imageUrl || null,
        in_stock: true,
      }).select("id").single();

      if (pErr) throw pErr;

      const { error: iErr } = await supabase.from("inventory").insert({
        product_id: product.id,
        quantity: parseInt(form.initialStock) || 30,
        reorder_level: parseInt(form.reorderLevel) || 10,
      });
      if (iErr) throw iErr;

      toast({ title: "Product Added", description: `${form.name} has been added successfully` });
      setForm({ name: "", price: "", originalPrice: "", costPrice: "", unit: "each", badge: "", description: "", categoryId: "", initialStock: "30", reorderLevel: "10" });
      setImageUrl("");
      onProductAdded?.();
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
          <Plus className="h-5 w-5" /> Add New Product
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Product Name *</Label>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Organic Bananas" />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <select
              value={form.categoryId}
              onChange={(e) => update("categoryId", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select category</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Product Image</Label>
            <ImageUpload bucket="product-images" onUploaded={setImageUrl} currentUrl={imageUrl} label="Upload product photo" />
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Or paste image URL"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Selling Price *</Label>
            <Input type="number" step="0.01" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="4.99" />
          </div>
          <div className="space-y-1.5">
            <Label>Original Price (for deals)</Label>
            <Input type="number" step="0.01" value={form.originalPrice} onChange={(e) => update("originalPrice", e.target.value)} placeholder="6.99" />
          </div>
          <div className="space-y-1.5">
            <Label>Cost Price</Label>
            <Input type="number" step="0.01" value={form.costPrice} onChange={(e) => update("costPrice", e.target.value)} placeholder="2.50" />
          </div>
          <div className="space-y-1.5">
            <Label>Unit</Label>
            <Input value={form.unit} onChange={(e) => update("unit", e.target.value)} placeholder="each, lb, pack" />
          </div>
          <div className="space-y-1.5">
            <Label>Badge</Label>
            <Input value={form.badge} onChange={(e) => update("badge", e.target.value)} placeholder="Sale, Organic, Premium" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Brief description" />
          </div>
          <div className="space-y-1.5">
            <Label>Initial Stock</Label>
            <Input type="number" value={form.initialStock} onChange={(e) => update("initialStock", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Reorder Level</Label>
            <Input type="number" value={form.reorderLevel} onChange={(e) => update("reorderLevel", e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Adding…" : "Add Product"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddProductForm;
