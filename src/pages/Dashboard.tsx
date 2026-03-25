import { useState } from "react";
import { Link } from "react-router-dom";
import { useDashboard } from "@/hooks/useDashboard";
import { OverviewTab } from "@/components/dashboard/OverviewTab";
import { SalesTab } from "@/components/dashboard/SalesTab";
import { InventoryTab } from "@/components/dashboard/InventoryTab";
import { OrdersTab } from "@/components/dashboard/OrdersTab";
import { AddProductsTab } from "@/components/dashboard/AddProductsTab";
import { ManageTab } from "@/components/dashboard/ManageTab";
import { AIInsightsTab } from "@/components/dashboard/AIInsightsTab";
import EditProductDialog from "@/components/EditProductDialog";
import EditCategoryDialog from "@/components/EditCategoryDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3, Package, DollarSign, PlusCircle, MessageCircle, Pencil, ArrowLeft,
} from "lucide-react";


const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "sales" | "inventory" | "orders" | "products" | "manage" | "ai">("overview");
  const {
    stats,
    salesByProduct,
    categoryRevenue,
    dailySales,
    inventory,
    recentOrders,
    allProducts,
    allCategories,
    editProduct,
    editCategory,
    setEditProduct,
    setEditCategory,
    fetchData,
    updateOrderStatus,
  } = useDashboard();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-4 w-4" /> Store
            </Link>
            <h1 className="font-display text-xl font-bold text-foreground">Management Console</h1>
          </div>
          <Badge variant="outline" className="border-primary text-primary">Admin</Badge>
        </div>
      </header>

      <div className="border-b border-border bg-card">
        <div className="container flex gap-1 overflow-x-auto">
          {[
            { key: "overview", label: "Overview", icon: BarChart3 },
            { key: "sales", label: "Sales", icon: DollarSign },
            { key: "inventory", label: "Inventory", icon: Package },
            { key: "orders", label: "Orders", icon: Package },
            { key: "products", label: "Add Products", icon: PlusCircle },
            { key: "manage", label: "Manage", icon: Pencil },
            { key: "ai", label: "AI Insights", icon: MessageCircle },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container py-8">
        {activeTab === "overview" && <OverviewTab stats={stats} salesByProduct={salesByProduct} dailySales={dailySales} categoryRevenue={categoryRevenue} />}
        {activeTab === "sales" && <SalesTab salesByProduct={salesByProduct} dailySales={dailySales} categoryRevenue={categoryRevenue} stats={stats} />}
        {activeTab === "inventory" && <InventoryTab inventory={inventory} />}
        {activeTab === "orders" && <OrdersTab orders={recentOrders} onUpdateStatus={updateOrderStatus} />}
        {activeTab === "products" && <AddProductsTab onProductAdded={fetchData} />}
        {activeTab === "manage" && <ManageTab allCategories={allCategories} allProducts={allProducts} onEditCategory={setEditCategory} onEditProduct={setEditProduct} />}
        {activeTab === "ai" && <AIInsightsTab />}
      </div>

      <EditProductDialog product={editProduct} open={!!editProduct} onOpenChange={(o) => !o && setEditProduct(null)} onSaved={fetchData} />
      <EditCategoryDialog category={editCategory} open={!!editCategory} onOpenChange={(o) => !o && setEditCategory(null)} onSaved={fetchData} />
    </div>
  );
};

export default Dashboard;
