import { Truck, Leaf, ShieldCheck, Clock } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { icon: Truck, title: "Free Delivery", desc: "On orders over $50" },
  { icon: Leaf, title: "100% Organic", desc: "Certified fresh produce" },
  { icon: ShieldCheck, title: "Quality Guarantee", desc: "Freshness promised" },
  { icon: Clock, title: "Same Day", desc: "Order by 2pm" },
];

const FeaturesStrip = () => {
  return (
    <section className="border-y border-border bg-accent/50 py-8">
      <div className="container grid grid-cols-2 gap-6 md:grid-cols-4">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <f.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{f.title}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesStrip;
