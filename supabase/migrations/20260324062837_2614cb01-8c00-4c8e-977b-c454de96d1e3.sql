
-- Trigger: auto-decrement inventory when a sales_log row is inserted
CREATE OR REPLACE FUNCTION public.decrement_inventory_on_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.inventory
  SET quantity = GREATEST(quantity - NEW.quantity, 0),
      updated_at = now()
  WHERE product_id = NEW.product_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_decrement_inventory_on_sale
AFTER INSERT ON public.sales_log
FOR EACH ROW
EXECUTE FUNCTION public.decrement_inventory_on_sale();

-- Also populate sales_log cost/profit from product cost_price
CREATE OR REPLACE FUNCTION public.populate_sales_cost()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_cost_price numeric;
BEGIN
  SELECT cost_price INTO v_cost_price FROM public.products WHERE id = NEW.product_id;
  IF v_cost_price IS NOT NULL THEN
    NEW.cost := v_cost_price * NEW.quantity;
    NEW.profit := NEW.revenue - NEW.cost;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_populate_sales_cost
BEFORE INSERT ON public.sales_log
FOR EACH ROW
EXECUTE FUNCTION public.populate_sales_cost();
