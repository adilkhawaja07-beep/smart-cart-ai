import { supabase } from "@/integrations/supabase/client";
import type { CartItem } from "@/contexts/CartContext";

interface OrderDetails {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  zipCode: string;
  email?: string;
}

export async function placeOrder(
  items: CartItem[],
  details: OrderDetails,
  subtotal: number,
  deliveryFee: number,
  tax: number,
  total: number
) {
  // 1. Create the order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_name: `${details.firstName} ${details.lastName}`,
      customer_email: details.email || null,
      address: details.address,
      city: details.city,
      zip_code: details.zipCode,
      subtotal,
      delivery_fee: deliveryFee,
      tax,
      total,
      status: "pending",
    })
    .select()
    .single();

  if (orderError) throw orderError;

  // 2. Create order items
  const orderItems = items.map((item) => ({
    order_id: order.id,
    product_id: item.product.id,
    product_name: item.product.name,
    quantity: item.quantity,
    unit_price: item.product.price,
    total_price: item.product.price * item.quantity,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) throw itemsError;

  // 3. Log sales
  const salesEntries = items.map((item) => ({
    order_id: order.id,
    product_id: item.product.id,
    quantity: item.quantity,
    revenue: item.product.price * item.quantity,
    cost: null, // cost_price is on the DB product, not available client-side
    profit: null,
    sold_at: new Date().toISOString(),
  }));

  const { error: salesError } = await supabase
    .from("sales_log")
    .insert(salesEntries);

  if (salesError) console.error("Sales logging failed:", salesError);

  return order;
}
