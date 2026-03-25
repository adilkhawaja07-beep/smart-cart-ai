import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Search, Menu, X, User, LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/contexts/RoleContext";
import { ROLE_CAPABILITIES } from "@/types/roles";
import logo from "@/assets/logo.png";

// Fallback links for non-authenticated users
const guestNavLinks = [
  { label: "Shop", href: "/shop" },
  { label: "Categories", href: "/categories" },
  { label: "Deals", href: "/deals" },
  { label: "About", href: "/about" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalItems, setIsCartOpen } = useCart();
  const { user, signOut } = useAuth();
  const { role, getNavItems, getDashboardPath } = useRole();
  const location = useLocation();

  // Use role-based nav items if user is authenticated, otherwise use guest links
  const navLinks = user && role ? getNavItems() : guestNavLinks;
  const dashboardPath = user && role ? getDashboardPath() : null;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="FreshCart" className="h-9 w-9" />
          <span className="font-display text-xl font-bold text-foreground">FreshCart</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === link.href ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          
          {/* Show dashboard link based on role with clear label */}
          {dashboardPath && user && (
            <Link
              to={dashboardPath}
              className={`flex items-center gap-2 text-sm font-medium px-3 py-1 rounded-md transition-colors ${
                location.pathname === dashboardPath 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>{role && ROLE_CAPABILITIES[role]?.label}</span>
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Search className="h-5 w-5" />
          </Button>

          {user ? (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-primary"
              onClick={() => signOut()}
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          ) : (
            <Link to="/auth">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          )}

          {/* Only show cart for customers */}
          {role === 'customer' && (
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:text-primary"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <motion.span
                  key={totalItems}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
                >
                  {totalItems}
                </motion.span>
              )}
            </Button>
          )}

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border bg-background md:hidden"
          >
            <div className="container flex flex-col gap-3 py-4">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  to={link.href} 
                  className="text-sm font-medium text-muted-foreground hover:text-primary" 
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {dashboardPath && (
                <Link 
                  to={dashboardPath} 
                  className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary" 
                  onClick={() => setMobileOpen(false)}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {role && ROLE_CAPABILITIES[role]?.label} Dashboard
                </Link>
              )}
              {!user && (
                <Link 
                  to="/auth" 
                  className="text-sm font-medium text-primary hover:underline" 
                  onClick={() => setMobileOpen(false)}
                >
                  Sign In / Sign Up
                </Link>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
