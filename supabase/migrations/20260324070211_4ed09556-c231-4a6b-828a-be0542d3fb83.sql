-- Allow admins to update order status
CREATE POLICY "Admins can update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update inventory (for restocking)
CREATE POLICY "Admins can update inventory"
ON public.inventory
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
