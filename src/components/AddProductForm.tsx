import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ProductRepository, InventoryRepository } from "@/lib/repositories/productRepository";
import { ProductForm, ProductFormData } from "@/components/ProductForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

interface AddProductFormProps {
  onProductAdded?: () => void;
}

/**
 * AddProductForm wrapper - handles product creation using ProductForm
 * This thin wrapper delegates form UI/logic to ProductForm component
 * and handles the create operation via repositories
 */
const AddProductForm = ({ onProductAdded }: AddProductFormProps) => {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (data: ProductFormData) => {
    setLoading(true);
    try {
      // Create product using repository
      const product = await ProductRepository.createProduct({
        name: data.name,
        price: parseFloat(data.price),
        original_price: data.originalPrice ? parseFloat(data.originalPrice) : null,
        cost_price: data.costPrice ? parseFloat(data.costPrice) : null,
        unit: data.unit || "each",
        badge: data.badge || null,
        description: data.description || null,
        category_id: data.categoryId || null,
        image_url: data.imageUrl || null,
        in_stock: true,
      });

      // Create inventory using repository
      await InventoryRepository.createInventory({
        product_id: product.id,
        quantity: parseInt(data.initialStock || "30"),
        reorder_level: parseInt(data.reorderLevel || "10"),
      });

      // Invalidate products cache so new product appears immediately
      queryClient.invalidateQueries({ queryKey: ["products"] });
      
      toast({
        title: "Product Added",
        description: `${data.name} has been added successfully`,
      });
      onProductAdded?.();
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" /> Add New Product
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ProductForm onSubmit={handleSubmit} loading={loading} />
      </CardContent>
    </Card>
  );
};

export default AddProductForm;
