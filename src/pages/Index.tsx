import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesStrip from "@/components/FeaturesStrip";
import CategoryCard from "@/components/CategoryCard";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import { categories, featuredProducts } from "@/data/products";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <FeaturesStrip />

      {/* Categories */}
      <section className="py-16">
        <div className="container">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
                Shop by Category
              </h2>
              <p className="mt-2 text-muted-foreground">
                Browse our carefully curated selection
              </p>
            </div>
            <Button variant="ghost" className="hidden gap-1 text-primary md:flex">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {categories.map((cat, i) => (
              <CategoryCard key={cat.name} {...cat} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-muted/50 py-16">
        <div className="container">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
                Featured Products
              </h2>
              <p className="mt-2 text-muted-foreground">
                Hand-picked favorites this week
              </p>
            </div>
            <Button variant="ghost" className="hidden gap-1 text-primary md:flex">
              Shop All <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {featuredProducts.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="overflow-hidden rounded-3xl bg-primary p-10 text-center text-primary-foreground md:p-16"
          >
            <h2 className="mb-4 font-display text-3xl font-bold md:text-4xl">
              Get 20% Off Your First Order
            </h2>
            <p className="mx-auto mb-8 max-w-md text-primary-foreground/80">
              Sign up today and enjoy farm-fresh groceries with free delivery on your first purchase.
            </p>
            <div className="mx-auto flex max-w-sm gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-full border-0 bg-primary-foreground/20 px-5 py-3 text-sm text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary-foreground/30"
              />
              <Button
                size="lg"
                className="rounded-full bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                Subscribe
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
