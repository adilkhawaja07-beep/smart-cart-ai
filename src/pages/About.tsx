import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, Leaf, Truck, Heart, ShieldCheck } from "lucide-react";

const values = [
  { icon: Leaf, title: "Farm Fresh", desc: "We source directly from local farms to ensure the freshest produce every day." },
  { icon: Truck, title: "Fast Delivery", desc: "Same-day delivery on orders placed before 2 PM. Free delivery over $50." },
  { icon: Heart, title: "Community First", desc: "We support local farmers and sustainable agriculture practices." },
  { icon: ShieldCheck, title: "Quality Guaranteed", desc: "100% satisfaction guarantee on every product we sell." },
];

const About = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="container py-12">
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Home
      </Link>
      <h1 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">About FreshCart</h1>
      <p className="mb-12 max-w-2xl text-lg text-muted-foreground">
        FreshCart is your neighborhood grocery store, reimagined for the digital age. We bring farm-fresh produce,
        artisan goods, and everyday essentials right to your doorstep with AI-powered shopping assistance.
      </p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {values.map((v) => (
          <div key={v.title} className="rounded-2xl border border-border bg-card p-6 text-center">
            <v.icon className="mx-auto mb-4 h-10 w-10 text-primary" />
            <h3 className="mb-2 font-display text-lg font-semibold text-card-foreground">{v.title}</h3>
            <p className="text-sm text-muted-foreground">{v.desc}</p>
          </div>
        ))}
      </div>
    </div>
    <Footer />
  </div>
);

export default About;
