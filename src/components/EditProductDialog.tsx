import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ProductRepository } from "@/lib/repositories/productRepository";
import { ProductForm, ProductFormData } from "@/components/ProductForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface EditProductDialogProps {
  product: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

/**
 * EditProductDialog wrapper - handles product editing using ProductForm
 * This thin wrapper uses ProductForm for UI and handles the update operation
 */
const EditProductDialog = ({
  product,
  open,
  onOpenChange,
  onSaved,
}: EditProductDialogProps) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: ProductFormData) => {
    setLoading(true);
    try {
      // Update product using repository
      await ProductRepository.updateProduct(product.id, {
        name: data.name,
        price: parseFloat(data.price),
        original_price: data.originalPrice ? parseFloat(data.originalPrice) : null,
        cost_price: data.costPrice ? parseFloat(data.costPrice) : null,
        unit: data.unit || "each",
        badge: data.badge || null,
        description: data.description || null,
        category_id: data.categoryId || null,
        image_url: data.imageUrl || null,
      } as any);

      toast({
        title: "Product Updated",
        description: `${data.name} has been updated`,
      });
      // Invalidate React Query caches to refresh data across the app
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products", "category"] });
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
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
        <ProductForm product={product} onSubmit={handleSubmit} loading={loading} />
      </DialogContent>
    </Dialog>
  );
};

export default EditProductDialog;