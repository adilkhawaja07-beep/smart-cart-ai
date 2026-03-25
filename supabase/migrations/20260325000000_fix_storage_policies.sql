-- Fix storage bucket policies for product and category images
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload category images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view category images" ON storage.objects;

-- Ensure RLS is enabled on storage.objects

-- Product images bucket policies
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated users to update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images' AND auth.uid() IS NOT NULL)
WITH CHECK (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

-- Allow public read of product images
CREATE POLICY "Allow public read of product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated users to delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

-- Category images bucket policies
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload category images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'category-images' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated users to update category images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'category-images' AND auth.uid() IS NOT NULL)
WITH CHECK (bucket_id = 'category-images' AND auth.uid() IS NOT NULL);

-- Allow public read of category images
CREATE POLICY "Allow public read of category images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'category-images');

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated users to delete category images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'category-images' AND auth.uid() IS NOT NULL);
