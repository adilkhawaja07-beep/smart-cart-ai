
-- New categories
INSERT INTO categories (id, name, description) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Fresh Fruits', 'Fresh, seasonal, and organic fruits'),
  ('a1000000-0000-0000-0000-000000000002', 'Vegetables', 'Fresh garden vegetables and produce'),
  ('a1000000-0000-0000-0000-000000000003', 'Dairy & Eggs', 'Milk, yogurt, cheese, and eggs'),
  ('a1000000-0000-0000-0000-000000000004', 'Bakery', 'Fresh breads, pastries, and baked goods'),
  ('a1000000-0000-0000-0000-000000000005', 'Meat & Seafood', 'Fresh cuts of meat and seafood'),
  ('a1000000-0000-0000-0000-000000000006', 'Beverages', 'Juices, water, coffee, and tea'),
  ('a1000000-0000-0000-0000-000000000007', 'Snacks & Chips', 'Crisps, nuts, and snack bars'),
  ('a1000000-0000-0000-0000-000000000008', 'Pantry & Grains', 'Rice, pasta, flour, and canned goods'),
  ('a1000000-0000-0000-0000-000000000009', 'Frozen Foods', 'Frozen meals, vegetables, and desserts'),
  ('a1000000-0000-0000-0000-000000000010', 'Organic & Health', 'Organic, gluten-free, and health foods')
ON CONFLICT (id) DO NOTHING;

-- More Fresh Fruits
INSERT INTO products (name, price, original_price, unit, badge, in_stock, description, category_id, cost_price) VALUES
  ('Organic Apples (6 pack)', 5.99, 7.49, 'pack', 'Organic', true, 'Crisp organic Fuji apples', 'a1000000-0000-0000-0000-000000000001', 3.20),
  ('Mangoes', 2.49, NULL, 'each', NULL, true, 'Sweet Alphonso mangoes', 'a1000000-0000-0000-0000-000000000001', 1.30),
  ('Watermelon', 6.99, 8.99, 'each', 'Sale', true, 'Seedless watermelon', 'a1000000-0000-0000-0000-000000000001', 3.50),
  ('Grapes (Red)', 4.49, NULL, 'lb', NULL, true, 'Fresh red seedless grapes', 'a1000000-0000-0000-0000-000000000001', 2.40),
  ('Pineapple', 3.99, NULL, 'each', NULL, true, 'Golden ripe pineapple', 'a1000000-0000-0000-0000-000000000001', 2.00),
  ('Kiwi (4 pack)', 3.49, NULL, 'pack', NULL, true, 'New Zealand kiwis', 'a1000000-0000-0000-0000-000000000001', 1.80);

-- More Vegetables
INSERT INTO products (name, price, original_price, unit, badge, in_stock, description, category_id, cost_price) VALUES
  ('Broccoli Crown', 2.29, NULL, 'each', NULL, true, 'Fresh broccoli crown', 'a1000000-0000-0000-0000-000000000002', 1.10),
  ('Cherry Tomatoes', 3.99, NULL, 'pint', NULL, true, 'Sweet cherry tomatoes', 'a1000000-0000-0000-0000-000000000002', 2.00),
  ('Sweet Potatoes', 1.49, NULL, 'lb', NULL, true, 'Organic sweet potatoes', 'a1000000-0000-0000-0000-000000000002', 0.70),
  ('Carrots (2 lb bag)', 2.99, NULL, 'bag', NULL, true, 'Fresh organic carrots', 'a1000000-0000-0000-0000-000000000002', 1.50),
  ('Zucchini', 1.79, NULL, 'each', NULL, true, 'Green zucchini squash', 'a1000000-0000-0000-0000-000000000002', 0.80),
  ('Cucumber', 1.29, NULL, 'each', NULL, true, 'English cucumber', 'a1000000-0000-0000-0000-000000000002', 0.60);

-- More Dairy & Eggs
INSERT INTO products (name, price, original_price, unit, badge, in_stock, description, category_id, cost_price) VALUES
  ('Cheddar Cheese Block', 5.49, NULL, 'block', NULL, true, 'Aged sharp cheddar', 'a1000000-0000-0000-0000-000000000003', 3.00),
  ('Butter (Unsalted)', 4.99, NULL, 'pack', NULL, true, 'European-style butter', 'a1000000-0000-0000-0000-000000000003', 2.80),
  ('Cream Cheese', 3.49, NULL, 'tub', NULL, true, 'Philadelphia cream cheese', 'a1000000-0000-0000-0000-000000000003', 1.90),
  ('Almond Milk', 3.99, 4.99, 'carton', 'Sale', true, 'Unsweetened almond milk', 'a1000000-0000-0000-0000-000000000003', 2.10),
  ('Mozzarella (Fresh)', 4.49, NULL, 'pack', NULL, true, 'Fresh mozzarella ball', 'a1000000-0000-0000-0000-000000000003', 2.50);

-- More Bakery
INSERT INTO products (name, price, original_price, unit, badge, in_stock, description, category_id, cost_price) VALUES
  ('Whole Wheat Bread', 3.99, NULL, 'loaf', NULL, true, 'Freshly baked whole wheat', 'a1000000-0000-0000-0000-000000000004', 2.00),
  ('Bagels (6 pack)', 4.49, NULL, 'pack', NULL, true, 'New York style bagels', 'a1000000-0000-0000-0000-000000000004', 2.30),
  ('Cinnamon Rolls', 5.99, 7.49, 'pack', 'Sale', true, 'Glazed cinnamon rolls', 'a1000000-0000-0000-0000-000000000004', 3.00),
  ('Chocolate Cake', 12.99, NULL, 'each', 'Premium', true, 'Rich double chocolate cake', 'a1000000-0000-0000-0000-000000000004', 6.50),
  ('Dinner Rolls (12 pack)', 3.49, NULL, 'pack', NULL, true, 'Soft dinner rolls', 'a1000000-0000-0000-0000-000000000004', 1.80);

-- Meat & Seafood
INSERT INTO products (name, price, original_price, unit, badge, in_stock, description, category_id, cost_price) VALUES
  ('Chicken Breast (Boneless)', 8.99, NULL, 'lb', NULL, true, 'Fresh boneless skinless', 'a1000000-0000-0000-0000-000000000005', 5.50),
  ('Salmon Fillet', 12.99, 14.99, 'lb', 'Sale', true, 'Wild-caught Atlantic salmon', 'a1000000-0000-0000-0000-000000000005', 8.00),
  ('Ground Beef (Lean)', 7.49, NULL, 'lb', NULL, true, '90% lean ground beef', 'a1000000-0000-0000-0000-000000000005', 4.50),
  ('Shrimp (Large)', 10.99, NULL, 'lb', NULL, true, 'Jumbo deveined shrimp', 'a1000000-0000-0000-0000-000000000005', 7.00),
  ('Lamb Chops', 15.99, NULL, 'lb', 'Premium', true, 'New Zealand lamb chops', 'a1000000-0000-0000-0000-000000000005', 10.00),
  ('Turkey Breast (Sliced)', 6.49, NULL, 'lb', NULL, true, 'Oven-roasted turkey slices', 'a1000000-0000-0000-0000-000000000005', 3.80);

-- Beverages
INSERT INTO products (name, price, original_price, unit, badge, in_stock, description, category_id, cost_price) VALUES
  ('Orange Juice (Fresh)', 4.99, NULL, 'bottle', NULL, true, 'Freshly squeezed OJ', 'a1000000-0000-0000-0000-000000000006', 2.50),
  ('Sparkling Water (12 pack)', 5.99, 7.49, 'pack', 'Sale', true, 'Natural sparkling mineral water', 'a1000000-0000-0000-0000-000000000006', 3.00),
  ('Green Tea (Box)', 3.49, NULL, 'box', NULL, true, 'Organic Japanese green tea', 'a1000000-0000-0000-0000-000000000006', 1.80),
  ('Cold Brew Coffee', 4.49, NULL, 'bottle', NULL, true, 'Single-origin cold brew', 'a1000000-0000-0000-0000-000000000006', 2.20),
  ('Coconut Water', 2.99, NULL, 'bottle', NULL, true, 'Pure coconut water', 'a1000000-0000-0000-0000-000000000006', 1.50),
  ('Apple Cider', 5.49, NULL, 'bottle', 'Seasonal', true, 'Fresh pressed apple cider', 'a1000000-0000-0000-0000-000000000006', 2.80);

-- Snacks & Chips
INSERT INTO products (name, price, original_price, unit, badge, in_stock, description, category_id, cost_price) VALUES
  ('Mixed Nuts (Roasted)', 7.99, NULL, 'bag', NULL, true, 'Premium roasted mixed nuts', 'a1000000-0000-0000-0000-000000000007', 4.50),
  ('Tortilla Chips', 3.49, NULL, 'bag', NULL, true, 'Restaurant-style tortilla chips', 'a1000000-0000-0000-0000-000000000007', 1.70),
  ('Dark Chocolate Bar', 3.99, NULL, 'bar', NULL, true, '72% cacao dark chocolate', 'a1000000-0000-0000-0000-000000000007', 2.00),
  ('Trail Mix', 5.49, 6.99, 'bag', 'Sale', true, 'Energy trail mix with dried fruits', 'a1000000-0000-0000-0000-000000000007', 2.80),
  ('Protein Bars (6 pack)', 8.99, NULL, 'box', NULL, true, 'High protein energy bars', 'a1000000-0000-0000-0000-000000000007', 5.00),
  ('Popcorn (Organic)', 4.49, NULL, 'bag', 'Organic', true, 'Lightly salted organic popcorn', 'a1000000-0000-0000-0000-000000000007', 2.20);

-- Pantry & Grains
INSERT INTO products (name, price, original_price, unit, badge, in_stock, description, category_id, cost_price) VALUES
  ('Basmati Rice (5 lb)', 6.99, NULL, 'bag', NULL, true, 'Premium aged basmati rice', 'a1000000-0000-0000-0000-000000000008', 3.50),
  ('Spaghetti Pasta', 2.49, NULL, 'box', NULL, true, 'Italian durum wheat pasta', 'a1000000-0000-0000-0000-000000000008', 1.20),
  ('Extra Virgin Olive Oil', 8.99, 10.99, 'bottle', 'Sale', true, 'Cold-pressed olive oil', 'a1000000-0000-0000-0000-000000000008', 5.00),
  ('Canned Tomatoes', 1.99, NULL, 'can', NULL, true, 'San Marzano whole tomatoes', 'a1000000-0000-0000-0000-000000000008', 0.90),
  ('All Purpose Flour', 3.49, NULL, 'bag', NULL, true, 'Unbleached all-purpose flour', 'a1000000-0000-0000-0000-000000000008', 1.80),
  ('Honey (Raw)', 7.49, NULL, 'jar', 'Premium', true, 'Raw wildflower honey', 'a1000000-0000-0000-0000-000000000008', 4.00),
  ('Quinoa', 5.99, NULL, 'bag', NULL, true, 'Organic white quinoa', 'a1000000-0000-0000-0000-000000000008', 3.20);

-- Frozen Foods
INSERT INTO products (name, price, original_price, unit, badge, in_stock, description, category_id, cost_price) VALUES
  ('Frozen Mixed Vegetables', 3.49, NULL, 'bag', NULL, true, 'Peas, corn, carrots, beans', 'a1000000-0000-0000-0000-000000000009', 1.70),
  ('Ice Cream (Vanilla)', 5.99, NULL, 'tub', NULL, true, 'Premium vanilla bean ice cream', 'a1000000-0000-0000-0000-000000000009', 3.00),
  ('Frozen Pizza (Margherita)', 6.49, 7.99, 'each', 'Sale', true, 'Stone-baked margherita pizza', 'a1000000-0000-0000-0000-000000000009', 3.50),
  ('Frozen Berries Mix', 4.99, NULL, 'bag', NULL, true, 'Strawberries, blueberries, raspberries', 'a1000000-0000-0000-0000-000000000009', 2.50),
  ('Fish Sticks', 4.49, NULL, 'box', NULL, true, 'Crispy breaded fish sticks', 'a1000000-0000-0000-0000-000000000009', 2.30),
  ('Frozen Waffles', 3.99, NULL, 'box', NULL, true, 'Belgian-style frozen waffles', 'a1000000-0000-0000-0000-000000000009', 2.00);

-- Organic & Health
INSERT INTO products (name, price, original_price, unit, badge, in_stock, description, category_id, cost_price) VALUES
  ('Chia Seeds', 6.99, NULL, 'bag', 'Organic', true, 'Organic black chia seeds', 'a1000000-0000-0000-0000-000000000010', 3.50),
  ('Oat Milk', 4.49, NULL, 'carton', NULL, true, 'Barista-edition oat milk', 'a1000000-0000-0000-0000-000000000010', 2.30),
  ('Gluten-Free Bread', 5.99, NULL, 'loaf', 'GF', true, 'Multigrain gluten-free bread', 'a1000000-0000-0000-0000-000000000010', 3.20),
  ('Coconut Oil (Virgin)', 7.99, 9.99, 'jar', 'Sale', true, 'Cold-pressed virgin coconut oil', 'a1000000-0000-0000-0000-000000000010', 4.50),
  ('Flax Seeds', 4.49, NULL, 'bag', 'Organic', true, 'Ground golden flax seeds', 'a1000000-0000-0000-0000-000000000010', 2.20),
  ('Almond Butter', 8.99, NULL, 'jar', NULL, true, 'Creamy no-sugar almond butter', 'a1000000-0000-0000-0000-000000000010', 5.00);

-- Insert inventory for ALL new products that don't have inventory yet
INSERT INTO inventory (product_id, quantity, reorder_level)
SELECT p.id, 30, 10
FROM products p
WHERE NOT EXISTS (SELECT 1 FROM inventory i WHERE i.product_id = p.id);

-- Allow admins to INSERT products
CREATE POLICY "Admins can insert products"
ON public.products FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to UPDATE products
CREATE POLICY "Admins can update products"
ON public.products FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to INSERT categories
CREATE POLICY "Admins can insert categories"
ON public.categories FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to INSERT inventory
CREATE POLICY "Admins can insert inventory"
ON public.inventory FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
