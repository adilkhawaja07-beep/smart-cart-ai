import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil } from "lucide-react";

export const ManageTab = ({
  allCategories,
  allProducts,
  onEditCategory,
  onEditProduct,
}: {
  allCategories: any[];
  allProducts: any[];
  onEditCategory: (cat: any) => void;
  onEditProduct: (prod: any) => void;
}) => (
  <div className="space-y-8">
    {/* Manage Categories */}
    <Card>
      <CardHeader>
        <CardTitle className="font-display">Manage Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 font-semibold text-muted-foreground">Image</th>
                <th className="pb-3 font-semibold text-muted-foreground">Name</th>
                <th className="pb-3 font-semibold text-muted-foreground">Description</th>
                <th className="pb-3 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allCategories.map((cat: any) => (
                <tr key={cat.id} className="border-b border-border/50">
                  <td className="py-3">
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
                        —
                      </div>
                    )}
                  </td>
                  <td className="py-3 font-medium text-foreground">{cat.name}</td>
                  <td className="py-3 text-muted-foreground">{cat.description || "—"}</td>
                  <td className="py-3">
                    <Button size="sm" variant="outline" onClick={() => onEditCategory(cat)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    {/* Manage Products */}
    <Card>
      <CardHeader>
        <CardTitle className="font-display">Manage Products</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 font-semibold text-muted-foreground">Image</th>
                <th className="pb-3 font-semibold text-muted-foreground">Name</th>
                <th className="pb-3 font-semibold text-muted-foreground">Category</th>
                <th className="pb-3 font-semibold text-muted-foreground">Price</th>
                <th className="pb-3 font-semibold text-muted-foreground">Unit</th>
                <th className="pb-3 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allProducts.map((p: any) => (
                <tr key={p.id} className="border-b border-border/50">
                  <td className="py-3">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
                        —
                      </div>
                    )}
                  </td>
                  <td className="py-3 font-medium text-foreground">{p.name}</td>
                  <td className="py-3 text-muted-foreground">{p.categories?.name || "—"}</td>
                  <td className="py-3 text-foreground">${Number(p.price).toFixed(2)}</td>
                  <td className="py-3 text-muted-foreground">{p.unit}</td>
                  <td className="py-3">
                    <Button size="sm" variant="outline" onClick={() => onEditProduct(p)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  </div>
);
