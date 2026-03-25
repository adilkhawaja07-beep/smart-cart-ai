-- Phase 3: Migration - Add image_url support to categories table
-- This migration adds image_url column to categories table if it doesn't exist
-- and populates it with Supabase storage URLs for existing categories

-- Step 1: Add image_url column to categories table if it doesn't exist
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;

-- Step 2: Add index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_categories_image_url ON categories(image_url) WHERE image_url IS NOT NULL;

-- Step 3: Update categories with Supabase image URLs
-- These URLs will be populated once the category images are uploaded to Supabase
-- For now, this serves as documentation of the mapping
-- After manually uploading images to Supabase category-images bucket,
-- run the following updates (or automate with app code):

-- Example update statement (update once files are actually in Supabase):
-- UPDATE categories SET image_url = 
--   CASE name
--     WHEN 'Fresh Fruits' THEN 'https://your-project.supabasecdn.co/storage/v1/object/public/category-images/category-fruits.jpg'
--     WHEN 'Vegetables' THEN 'https://your-project.supabasecdn.co/storage/v1/object/public/category-images/category-vegetables.jpg'
--     WHEN 'Dairy & Eggs' THEN 'https://your-project.supabasecdn.co/storage/v1/object/public/category-images/category-dairy.jpg'
--     WHEN 'Bakery' THEN 'https://your-project.supabasecdn.co/storage/v1/object/public/category-images/category-bakery.jpg'
--     WHEN 'Meat & Seafood' THEN 'https://your-project.supabasecdn.co/storage/v1/object/public/category-images/category-meat-seafood.jpg'
--     WHEN 'Beverages' THEN 'https://your-project.supabasecdn.co/storage/v1/object/public/category-images/category-beverages.jpg'
--     WHEN 'Snacks & Chips' THEN 'https://your-project.supabasecdn.co/storage/v1/object/public/category-images/category-snacks.jpg'
--     WHEN 'Pantry & Grains' THEN 'https://your-project.supabasecdn.co/storage/v1/object/public/category-images/category-pantry.jpg'
--     WHEN 'Frozen Foods' THEN 'https://your-project.supabasecdn.co/storage/v1/object/public/category-images/category-frozen.jpg'
--     WHEN 'Organic & Health' THEN 'https://your-project.supabasecdn.co/storage/v1/object/public/category-images/category-organic.jpg'
--   END
-- WHERE image_url IS NULL AND name IN ('Fresh Fruits', 'Vegetables', 'Dairy & Eggs', 'Bakery', 'Meat & Seafood', 'Beverages', 'Snacks & Chips', 'Pantry & Grains', 'Frozen Foods', 'Organic & Health');

-- Step 4: Create a view for category data including images (optional, for convenience)
-- This view shows categories with proper image URL from database
-- CREATE OR REPLACE VIEW v_categories_with_images AS
-- SELECT 
--   id,
--   name,
--   description,
--   COALESCE(image_url, '') as image_url,
--   created_at,
--   updated_at
-- FROM categories
-- ORDER BY name;
