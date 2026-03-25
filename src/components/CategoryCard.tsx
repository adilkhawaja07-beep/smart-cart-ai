import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { OptimizedImage } from "@/components/OptimizedImage";

interface CategoryCardProps {
  name: string;
  image: string;
  itemCount: number;
  index: number;
}

const CategoryCard = ({ name, image, itemCount, index }: CategoryCardProps) => {
  const [imageSrc, setImageSrc] = useState(image || "/placeholder.svg");

  useEffect(() => {
    // Use image URL as-is (versioning handled at data layer)
    // No cache-busting needed - allows browser/CDN caching
    const imageUrl = image || "/placeholder.svg";
    setImageSrc(imageUrl);
  }, [image]);

  return (
    <Link to={`/shop?category=${encodeURIComponent(name)}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
        whileHover={{ y: -6 }}
        className="group cursor-pointer overflow-hidden rounded-2xl bg-card shadow-sm transition-shadow hover:shadow-lg"
      >
        <div className="aspect-square overflow-hidden">
          <OptimizedImage
            src={imageSrc}
            alt={name}
            width={640}
            height={640}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImageSrc("/placeholder.svg")}
          />
        </div>
        <div className="p-4 text-center">
          <h3 className="font-display text-lg font-semibold text-card-foreground">
            {name}
          </h3>
          <p className="text-sm text-muted-foreground">{itemCount} items</p>
        </div>
      </motion.div>
    </Link>
  );
};

export default CategoryCard;
