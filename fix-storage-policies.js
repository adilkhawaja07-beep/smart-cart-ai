#!/usr/bin/env node

/**
 * This script fixes the storage bucket RLS policies
 * Run with: node fix-storage-policies.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Check your .env file');
  process.exit(1);
}

console.log('🔧 Fixing Supabase storage policies...');

const sql = `
-- Fix storage bucket policies
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload category images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view category images" ON storage.objects;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Product images policies
CREATE POLICY "Allow authenticated users to upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images' AND auth.uid() IS NOT NULL)
WITH CHECK (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow public read of product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Allow authenticated users to delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

-- Category images policies
CREATE POLICY "Allow authenticated users to upload category images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'category-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update category images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'category-images' AND auth.uid() IS NOT NULL)
WITH CHECK (bucket_id = 'category-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow public read of category images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'category-images');

CREATE POLICY "Allow authenticated users to delete category images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'category-images' AND auth.uid() IS NOT NULL);
`;

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) throw error;
    
    console.log('✅ Storage policies fixed successfully!');
    console.log('You can now upload images.');
  } catch (err) {
    console.error('❌ Error fixing policies:', err.message);
    process.exit(1);
  }
})();
