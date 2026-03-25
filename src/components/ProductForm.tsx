import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ProductRepository, InventoryRepository } from "@/lib/repositories/productRepository";
import { useCategories } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import ImageUpload from "@/components/ImageUpload";

export interface ProductFormData {
  name: string;
  price: string;
  originalPrice: string;
  costPrice: string;
  unit: string;
  badge: string;
  description: string;
  categoryId: string;
  imageUrl: string;
  initialStock?: string;
  reorderLevel?: string;
}

interface ProductFormProps {
  product?: any | null;
  onSubmit: (data: ProductFormData, isEdit: boolean) => Promise<void>;
  submitLabel?: string;
  loading?: boolean;
}

/**
 * Shared ProductForm component for both add and edit modes
 * - Handles form state and validation
 * - Manages image upload
 * - Normalizes data for both create and update operations
 * - Eliminates code duplication between AddProductForm and EditProductDialog
 */
export const ProductForm = ({
  product = null,
  onSubmit,
  submitLabel = product ? "Save Changes" : "Add Product",
  loading = false,
}: ProductFormProps) => {
  const { data: categories } = useCategories();
  const [form, setForm] = useState<ProductFormData>({
    name: "",
    price: "",
    originalPrice: "",
    costPrice: "",
    unit: "each",
    badge: "",
    description: "",
    categoryId: "",
    imageUrl: "",
    initialStock: "30",
    reorderLevel: "10",
  });

  // Populate form when product changes (for edit mode)
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
        initialStock: "30",
        reorderLevel: "10",
      });
    } else {
      // Reset to defaults for add mode
      setForm({
        name: "",
        price: "",
        originalPrice: "",
        costPrice: "",
        unit: "each",
        badge: "",
        description: "",
        categoryId: "",
        imageUrl: "",
        initialStock: "30",
        reorderLevel: "10",
      });
    }
  }, [product]);

  const update = (field: string, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      toast({
        title: "Missing fields",
        description: "Name and price are required",
        variant: "destructive",
      });
      return;
    }

    try {
      await onSubmit(form, !!product);
    } catch (err) {
      // Error handling is done in onSubmit
    }
  };

  const isEdit = !!product;

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="space-y-1.5">
        <Label>Product Name *</Label>
        <Input
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="e.g. Organic Bananas"
        />
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
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label>Product Image</Label>
        <ImageUpload
          bucket="product-images"
          onUploaded={(url) => update("imageUrl", url)}
          currentUrl={form.imageUrl}
          label={isEdit ? "Upload new image" : "Upload product photo"}
        />
        <Input
          value={form.imageUrl}
          onChange={(e) => update("imageUrl", e.target.value)}
          placeholder="Or paste image URL"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Selling Price *</Label>
        <Input
          type="number"
          step="0.01"
          value={form.price}
          onChange={(e) => update("price", e.target.value)}
          placeholder="4.99"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Original Price (for deals)</Label>
        <Input
          type="number"
          step="0.01"
          value={form.originalPrice}
          onChange={(e) => update("originalPrice", e.target.value)}
          placeholder="6.99"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Cost Price</Label>
        <Input
          type="number"
          step="0.01"
          value={form.costPrice}
          onChange={(e) => update("costPrice", e.target.value)}
          placeholder="2.50"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Unit</Label>
        <Input
          value={form.unit}
          onChange={(e) => update("unit", e.target.value)}
          placeholder="each, lb, pack"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Badge</Label>
        <Input
          value={form.badge}
          onChange={(e) => update("badge", e.target.value)}
          placeholder="Sale, Organic, Premium"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <Input
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Brief description"
        />
      </div>

      {!isEdit && (
        <>
          <div className="space-y-1.5">
            <Label>Initial Stock</Label>
            <Input
              type="number"
              value={form.initialStock}
              onChange={(e) => update("initialStock", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Reorder Level</Label>
            <Input
              type="number"
              value={form.reorderLevel}
              onChange={(e) => update("reorderLevel", e.target.value)}
            />
          </div>
        </>
      )}

      <div className="flex items-end">
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (isEdit ? "Saving…" : "Adding…") : submitLabel}
        </Button>
      </div>
    </form>
  );
};
