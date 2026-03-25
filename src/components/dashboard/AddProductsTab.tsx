import AddCategoryForm from "@/components/AddCategoryForm";
import AddProductForm from "@/components/AddProductForm";

export const AddProductsTab = ({ onProductAdded }: { onProductAdded: () => void }) => (
  <div className="space-y-6">
    <AddCategoryForm onCategoryAdded={onProductAdded} />
    <AddProductForm onProductAdded={onProductAdded} />
  </div>
);
