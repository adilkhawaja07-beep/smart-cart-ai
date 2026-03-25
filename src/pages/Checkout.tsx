import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { OrderRepository } from "@/lib/repositories/orderRepository";
import { PricingService } from "@/lib/services/pricingService";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { toast } = useToast();
  const [placed, setPlaced] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    firstName: "", lastName: "", address: "", city: "", zipCode: "", email: "",
    cardNumber: "", expiry: "", cvc: "",
  });

  // Use PricingService for pricing calculations
  const pricing = PricingService.calculatePricing(totalPrice);

  const updateForm = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await OrderRepository.createOrder({
        items,
        details: {
          firstName: form.firstName,
          lastName: form.lastName,
          address: form.address,
          city: form.city,
          zipCode: form.zipCode,
          email: form.email || undefined,
        },
        subtotal: pricing.subtotal,
        deliveryFee: pricing.deliveryFee,
        tax: pricing.tax,
        total: pricing.total,
      });
      setPlaced(true);
      clearCart();
      toast({ title: "Order placed!", description: "Your fresh groceries are on the way 🥬" });
    } catch (err) {
      console.error(err);
      toast({ title: "Order failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (placed) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
            <CheckCircle className="mx-auto mb-6 h-20 w-20 text-primary" />
          </motion.div>
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">Order Confirmed!</h1>
          <p className="mb-8 text-muted-foreground">Thank you for shopping with FreshCart. Your order will arrive soon.</p>
          <Link to="/">
            <Button className="rounded-full gap-2">
              <ArrowLeft className="h-4 w-4" /> Continue Shopping
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
          <h1 className="mb-2 font-display text-2xl font-bold text-foreground">Your cart is empty</h1>
          <p className="mb-6 text-muted-foreground">Add some items before checking out.</p>
          <Link to="/"><Button className="rounded-full">Shop Now</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-10">
        <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to shopping
        </Link>
        <h1 className="mb-8 font-display text-3xl font-bold text-foreground">Checkout</h1>

        <div className="grid gap-8 lg:grid-cols-5">
          <form onSubmit={handlePlaceOrder} className="space-y-6 lg:col-span-3">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-4 font-display text-lg font-semibold text-card-foreground">Delivery Details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>First Name</Label><Input required value={form.firstName} onChange={(e) => updateForm("firstName", e.target.value)} placeholder="John" /></div>
                <div><Label>Last Name</Label><Input required value={form.lastName} onChange={(e) => updateForm("lastName", e.target.value)} placeholder="Doe" /></div>
                <div className="sm:col-span-2"><Label>Email (optional)</Label><Input type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} placeholder="john@example.com" /></div>
                <div className="sm:col-span-2"><Label>Address</Label><Input required value={form.address} onChange={(e) => updateForm("address", e.target.value)} placeholder="123 Fresh St" /></div>
                <div><Label>City</Label><Input required value={form.city} onChange={(e) => updateForm("city", e.target.value)} placeholder="San Francisco" /></div>
                <div><Label>ZIP Code</Label><Input required value={form.zipCode} onChange={(e) => updateForm("zipCode", e.target.value)} placeholder="94102" /></div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-4 font-display text-lg font-semibold text-card-foreground">Payment</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><Label>Card Number</Label><Input required value={form.cardNumber} onChange={(e) => updateForm("cardNumber", e.target.value)} placeholder="4242 4242 4242 4242" /></div>
                <div><Label>Expiry</Label><Input required value={form.expiry} onChange={(e) => updateForm("expiry", e.target.value)} placeholder="MM/YY" /></div>
                <div><Label>CVC</Label><Input required value={form.cvc} onChange={(e) => updateForm("cvc", e.target.value)} placeholder="123" /></div>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full rounded-full" disabled={submitting}>
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</> : `Place Order — $${grandTotal.toFixed(2)}`}
            </Button>
          </form>

          <div className="lg:col-span-2">
            <div className="sticky top-24 rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-4 font-display text-lg font-semibold text-card-foreground">Order Summary</h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-3">
                    <img src={item.product.image} alt={item.product.name} className="h-12 w-12 rounded-lg object-cover" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-card-foreground line-clamp-1">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">${(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>${totalPrice.toFixed(2)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Delivery</span><span>{pricing.deliveryFee === 0 ? "Free" : `$${pricing.deliveryFee.toFixed(2)}`}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Tax</span><span>${pricing.tax.toFixed(2)}</span></div>
                <Separator />
                <div className="flex justify-between text-base font-bold text-foreground"><span>Total</span><span>${pricing.total.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Checkout;
