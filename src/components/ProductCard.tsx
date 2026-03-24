import { motion } from "framer-motion";
import { ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  badge?: string;
  unit: string;
  inStock: boolean;
}

interface ProductCardProps {
  product: Product;
  index: number;
}

const ProductCard = ({ product, index }: ProductCardProps) => {
  const { addItem } = useCart();
  const { toast } = useToast();

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const handleAdd = () => {
    addItem(product);
    toast({ title: `${product.name} added`, description: "Item added to your cart" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          width={400}
          height={400}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-col gap-1">
          {product.badge && (
            <Badge className="bg-primary text-primary-foreground">{product.badge}</Badge>
          )}
          {discount > 0 && <Badge variant="destructive">-{discount}%</Badge>}
        </div>
        <button className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-muted-foreground opacity-0 backdrop-blur-sm transition-all hover:text-destructive group-hover:opacity-100">
          <Heart className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {product.category}
        </p>
        <h3 className="mb-2 font-display text-base font-semibold text-card-foreground line-clamp-1">
          {product.name}
        </h3>
        <div className="mb-3 flex items-baseline gap-2">
          <span className="text-lg font-bold text-primary">${product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
          <span className="text-xs text-muted-foreground">/ {product.unit}</span>
        </div>
        <Button
          size="sm"
          className="w-full gap-2 rounded-full"
          disabled={!product.inStock}
          onClick={handleAdd}
        >
          <ShoppingCart className="h-4 w-4" />
          {product.inStock ? "Add to Cart" : "Out of Stock"}
        </Button>
      </div>
    </motion.div>
  );
};

export default ProductCard;
