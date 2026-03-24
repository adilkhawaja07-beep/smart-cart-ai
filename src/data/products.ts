import categoryFruits from "@/assets/category-fruits.jpg";
import categoryVegetables from "@/assets/category-vegetables.jpg";
import categoryDairy from "@/assets/category-dairy.jpg";
import categoryBakery from "@/assets/category-bakery.jpg";

import type { Product } from "@/components/ProductCard";

export const categories = [
  { name: "Fresh Fruits", image: categoryFruits, itemCount: 48 },
  { name: "Vegetables", image: categoryVegetables, itemCount: 62 },
  { name: "Dairy & Eggs", image: categoryDairy, itemCount: 35 },
  { name: "Bakery", image: categoryBakery, itemCount: 28 },
];

export const featuredProducts: Product[] = [
  {
    id: "1",
    name: "Organic Avocados",
    price: 4.99,
    originalPrice: 6.49,
    image: categoryVegetables,
    category: "Vegetables",
    badge: "Organic",
    unit: "pack of 3",
    inStock: true,
  },
  {
    id: "2",
    name: "Fresh Strawberries",
    price: 5.49,
    image: categoryFruits,
    category: "Fruits",
    badge: "Seasonal",
    unit: "lb",
    inStock: true,
  },
  {
    id: "3",
    name: "Artisan Sourdough Bread",
    price: 6.99,
    image: categoryBakery,
    category: "Bakery",
    unit: "loaf",
    inStock: true,
  },
  {
    id: "4",
    name: "Farm Fresh Whole Milk",
    price: 4.29,
    originalPrice: 5.49,
    image: categoryDairy,
    category: "Dairy",
    badge: "Local",
    unit: "gallon",
    inStock: true,
  },
  {
    id: "5",
    name: "Organic Baby Spinach",
    price: 3.99,
    image: categoryVegetables,
    category: "Vegetables",
    badge: "Organic",
    unit: "5 oz",
    inStock: true,
  },
  {
    id: "6",
    name: "Blueberry Muffins",
    price: 7.49,
    originalPrice: 8.99,
    image: categoryBakery,
    category: "Bakery",
    unit: "pack of 4",
    inStock: true,
  },
  {
    id: "7",
    name: "Mixed Berry Medley",
    price: 8.99,
    image: categoryFruits,
    category: "Fruits",
    badge: "Popular",
    unit: "lb",
    inStock: true,
  },
  {
    id: "8",
    name: "Greek Yogurt Variety",
    price: 6.49,
    image: categoryDairy,
    category: "Dairy",
    unit: "pack of 6",
    inStock: false,
  },
];
