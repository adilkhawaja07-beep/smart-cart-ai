import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCategories, useProducts } from "@/hooks/useProducts";
import { Loader2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

import categoryFruits from "@/assets/category-fruits.jpg";
import categoryVegetables from "@/assets/category-vegetables.jpg";
import categoryDairy from "@/assets/category-dairy.jpg";
import categoryBakery from "@/assets/category-bakery.jpg";

const categoryImages: Record<string, string> = {
  "Fresh Fruits": categoryFruits,
  Vegetables: categoryVegetables,
  "Dairy & Eggs": categoryDairy,
  Bakery: categoryBakery,
};

const Categories = () => {
  const { data: categories, isLoading } = useCategories();
  const { data: products } = useProducts();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <h1 className="mb-8 font-display text-3xl font-bold text-foreground md:text-4xl">Shop by Category</h1>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories?.map((cat, i) => {
              const count = products?.filter((p) => p.category === cat.name).length || 0;
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    to={`/shop?category=${encodeURIComponent(cat.name)}`}
                    className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg"
                  >
                    <div className="aspect-[16/10] overflow-hidden">
                      <img
                        src={categoryImages[cat.name] || cat.image_url || "/placeholder.svg"}
                        alt={cat.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-5">
                      <h2 className="font-display text-xl font-semibold text-card-foreground">{cat.name}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{cat.description}</p>
                      <p className="mt-2 text-sm font-medium text-primary">{count} products →</p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Categories;
