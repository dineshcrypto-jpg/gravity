-- ==============================================================================
-- KSN SUPER STORE: ADD PRODUCT & VARIETY SPECIFIC OFFERS
-- Run this in Supabase Dashboard -> SQL Editor
-- This adds the 'offer' column to both 'products' and 'varieties' tables
-- so you can set offers for specific products or varieties (e.g. Free 1 Gulab Jamun Cup on 200ml Cow Ghee)
-- ==============================================================================

-- 1. Add offer column to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS offer TEXT;

-- 2. Add offer column to varieties
ALTER TABLE public.varieties 
ADD COLUMN IF NOT EXISTS offer TEXT;

-- 3. Verify columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name IN ('products', 'varieties')
  AND column_name = 'offer';
