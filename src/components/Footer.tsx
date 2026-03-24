import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="container grid gap-8 md:grid-cols-4">
        <div>
          <Link to="/" className="mb-4 flex items-center gap-2">
            <img src={logo} alt="FreshCart" className="h-8 w-8" />
            <span className="font-display text-lg font-bold text-foreground">FreshCart</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Farm-fresh groceries delivered to your doorstep. Quality you can taste, convenience you'll love.
          </p>
        </div>
        {[
          { title: "Shop", links: ["All Products", "Fruits", "Vegetables", "Dairy", "Bakery"] },
          { title: "Company", links: ["About Us", "Careers", "Blog", "Press"] },
          { title: "Support", links: ["Help Center", "Contact", "Shipping", "Returns"] },
        ].map((col) => (
          <div key={col.title}>
            <h4 className="mb-3 font-display text-sm font-semibold text-foreground">{col.title}</h4>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link}>
                  <Link to="#" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
        © 2026 FreshCart. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
