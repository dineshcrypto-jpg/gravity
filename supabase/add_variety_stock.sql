-- ==============================================================================
-- KSN SUPER STORE: ADD STOCK STATUS TO VARIETIES TABLE
-- Run this one-time script in your Supabase Dashboard -> SQL Editor
-- This adds the 'is_in_stock' column so individual varieties (sizes, sachets, packs)
-- can be marked In Stock or Out of Stock independently.
-- ==============================================================================

-- 1. Add is_in_stock column to varieties table (defaults to true)
ALTER TABLE public.varieties 
ADD COLUMN IF NOT EXISTS is_in_stock BOOLEAN DEFAULT true NOT NULL;

-- 2. Verify column exists
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'varieties';
