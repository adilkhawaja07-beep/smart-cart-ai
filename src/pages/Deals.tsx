import { useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { Loader2, ArrowLeft, Tag } from "lucide-react";

const Deals = () => {
  const { data: products, isLoading } = useProducts();

  const deals = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => p.originalPrice && p.originalPrice > p.price);
  }, [products]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <div className="mb-8 flex items-center gap-3">
          <Tag className="h-8 w-8 text-destructive" />
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">Today's Deals</h1>
            <p className="text-muted-foreground">Save on your favorite products</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : deals.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg font-semibold text-foreground">No deals right now</p>
            <p className="mt-1 text-sm text-muted-foreground">Check back soon for special offers!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
            {deals.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Deals;
