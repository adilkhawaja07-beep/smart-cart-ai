-- Phase 4: Migration - Create image_versions table for full image history tracking
-- This table maintains a complete audit trail of all image changes
-- Enables rollback to previous versions and tracks who uploaded/changed images

CREATE TABLE IF NOT EXISTS image_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What this image version belongs to
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  
  -- Image metadata
  storage_path TEXT NOT NULL,                    -- e.g., "product-images/abc123.jpg"
  public_url TEXT NOT NULL,                     -- Full CDN URL
  
  -- Version tracking
  version_number INT NOT NULL,                  -- Auto-incrementing version (1, 2, 3...)
  file_hash TEXT,                                -- Optional: SHA-256 hash for dedup
  file_size INT,                                 -- File size in bytes
  file_mime_type TEXT,                          -- MIME type (image/jpeg, etc.)
  
  -- Audit trail
  uploaded_by UUID,                              -- Future: user ID if auth available
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Flagging and status
  is_current BOOLEAN DEFAULT true,               -- Is this the active version?
  is_deleted BOOLEAN DEFAULT false,              -- Soft delete flag
  
  -- Constraints
  CONSTRAINT one_product_or_category CHECK (
    (product_id IS NOT NULL AND category_id IS NULL) OR
    (product_id IS NULL AND category_id IS NOT NULL)
  ),
  
  -- Ensure version numbers are unique per product/category
  UNIQUE(product_id, version_number),
  UNIQUE(category_id, version_number)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_image_versions_product_id ON image_versions(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_image_versions_category_id ON image_versions(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_image_versions_is_current ON image_versions(is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_image_versions_product_current ON image_versions(product_id, is_current) 
  WHERE product_id IS NOT NULL AND is_current = true;
CREATE INDEX IF NOT EXISTS idx_image_versions_category_current ON image_versions(category_id, is_current) 
  WHERE category_id IS NOT NULL AND is_current = true;
CREATE INDEX IF NOT EXISTS idx_image_versions_uploaded_at ON image_versions(uploaded_at DESC);

-- Create view for easy access to image history
CREATE OR REPLACE VIEW v_product_image_history AS
SELECT 
  id,
  product_id,
  version_number,
  storage_path,
  public_url,
  file_size,
  file_hash,
  is_current,
  uploaded_at,
  is_deleted
FROM image_versions
WHERE product_id IS NOT NULL
ORDER BY product_id, version_number DESC;

-- Create view for current images
CREATE OR REPLACE VIEW v_current_product_images AS
SELECT 
  product_id,
  version_number,
  public_url,
  storage_path,
  uploaded_at
FROM image_versions
WHERE product_id IS NOT NULL 
  AND is_current = true
  AND is_deleted = false;

-- Create view for category image history
CREATE OR REPLACE VIEW v_category_image_history AS
SELECT 
  id,
  category_id,
  version_number,
  storage_path,
  public_url,
  file_size,
  file_hash,
  is_current,
  uploaded_at,
  is_deleted
FROM image_versions
WHERE category_id IS NOT NULL
ORDER BY category_id, version_number DESC;
