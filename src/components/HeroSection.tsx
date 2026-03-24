import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroProduce from "@/assets/hero-produce.jpg";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroProduce}
          alt="Fresh organic produce"
          className="h-full w-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent" />
      </div>

      <div className="container relative z-10 flex min-h-[520px] items-center py-20 md:min-h-[600px]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-xl"
        >
          <span className="mb-4 inline-block rounded-full bg-primary/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-foreground">
            Farm Fresh • Organic • Local
          </span>
          <h1 className="mb-6 font-display text-4xl font-bold leading-tight text-primary-foreground md:text-6xl">
            Fresh Groceries,{" "}
            <span className="text-fresh-sage">Delivered</span> to Your Door
          </h1>
          <p className="mb-8 max-w-md text-base leading-relaxed text-primary-foreground/80 md:text-lg">
            Discover farm-fresh produce, artisan goods, and pantry essentials — 
            all curated with care and powered by smart recommendations.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" className="gap-2 rounded-full bg-primary px-8 text-primary-foreground shadow-lg hover:bg-primary/90">
              Shop Now <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="rounded-full border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              Browse Categories
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
