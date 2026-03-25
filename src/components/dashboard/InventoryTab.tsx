import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const InventoryTab = ({ inventory }: { inventory: any[] }) => (
  <Card>
    <CardHeader>
      <CardTitle className="font-display">Inventory Levels</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-3 font-semibold text-muted-foreground">Product</th>
              <th className="pb-3 font-semibold text-muted-foreground">Stock</th>
              <th className="pb-3 font-semibold text-muted-foreground">Reorder Level</th>
              <th className="pb-3 font-semibold text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item: any) => {
              const isLow = item.quantity <= item.reorder_level;
              const isOut = item.quantity === 0;
              return (
                <tr key={item.id} className="border-b border-border/50">
                  <td className="py-3 font-medium text-foreground">{item.products?.name || "Unknown"}</td>
                  <td className="py-3 text-foreground">{item.quantity}</td>
                  <td className="py-3 text-muted-foreground">{item.reorder_level}</td>
                  <td className="py-3">
                    <Badge
                      variant={isOut ? "destructive" : isLow ? "outline" : "default"}
                      className={isOut ? "" : isLow ? "border-amber-500 text-amber-600" : "bg-primary/10 text-primary"}
                    >
                      {isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
);
