import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useProducts, useCategories } from "@/hooks/useProducts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, Loader2, ArrowLeft } from "lucide-react";

type SortOption = "name" | "price-asc" | "price-desc" | "newest";

const Shop = () => {
  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>("newest");
  const [inStockOnly, setInStockOnly] = useState(false);

  const filtered = useMemo(() => {
    if (!products) return [];
    let result = [...products];

    if (search) {
      const term = search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term));
    }
    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory);
    }
    if (inStockOnly) {
      result = result.filter((p) => p.inStock);
    }

    switch (sort) {
      case "name": result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "price-asc": result.sort((a, b) => a.price - b.price); break;
      case "price-desc": result.sort((a, b) => b.price - a.price); break;
      default: break; // newest - already sorted by created_at desc
    }

    return result;
  }, [products, search, selectedCategory, sort, inStockOnly]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <h1 className="mb-6 font-display text-3xl font-bold text-foreground md:text-4xl">Shop All Products</h1>

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-full"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            {categories?.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.name ? "default" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filtered.length} product{filtered.length !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded border-border"
              />
              In stock only
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground"
            >
              <option value="newest">Newest</option>
              <option value="name">Name A-Z</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg font-semibold text-foreground">No products found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
            {filtered.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Shop;
