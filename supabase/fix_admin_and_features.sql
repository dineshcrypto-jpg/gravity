-- ==============================================================================
-- KSN SUPER STORE: FIX ADMIN WRITE ACCESS, POLICIES & DATABASE COLUMNS
-- ==============================================================================
-- Run this in Supabase Dashboard -> SQL Editor (Click 'Run' or Ctrl+Enter)
-- This fixes:
--   1. Products changes not saving (adds missing UPDATE/INSERT/DELETE RLS policies)
--   2. Adds secondary_image_url to products table for the 2-photo switcher
--   3. Adds is_in_stock to varieties table for independent variety stock toggling
-- ==============================================================================

-- ─── 1. Ensure required columns exist ────────────────────────────────────────

-- Add secondary_image_url to products if not already added
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS secondary_image_url TEXT;

-- Add is_in_stock to varieties if not already added
ALTER TABLE public.varieties 
ADD COLUMN IF NOT EXISTS is_in_stock BOOLEAN DEFAULT true NOT NULL;


-- ─── 2. Fix Products Table RLS (Read + Write Access) ─────────────────────────

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'Allow public read access on products'
  ) THEN
    CREATE POLICY "Allow public read access on products" ON public.products FOR SELECT USING (true);
  END IF;
END $$;

-- Allow insert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'Allow admin insert on products'
  ) THEN
    CREATE POLICY "Allow admin insert on products" ON public.products FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Allow update
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'Allow admin update on products'
  ) THEN
    CREATE POLICY "Allow admin update on products" ON public.products FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Allow delete
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'Allow admin delete on products'
  ) THEN
    CREATE POLICY "Allow admin delete on products" ON public.products FOR DELETE USING (true);
  END IF;
END $$;


-- ─── 3. Fix Varieties Table RLS (Read + Write Access) ────────────────────────

ALTER TABLE public.varieties ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'varieties' AND policyname = 'Allow public read access on varieties'
  ) THEN
    CREATE POLICY "Allow public read access on varieties" ON public.varieties FOR SELECT USING (true);
  END IF;
END $$;

-- Allow insert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'varieties' AND policyname = 'Allow admin insert on varieties'
  ) THEN
    CREATE POLICY "Allow admin insert on varieties" ON public.varieties FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Allow update
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'varieties' AND policyname = 'Allow admin update on varieties'
  ) THEN
    CREATE POLICY "Allow admin update on varieties" ON public.varieties FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Allow delete
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'varieties' AND policyname = 'Allow admin delete on varieties'
  ) THEN
    CREATE POLICY "Allow admin delete on varieties" ON public.varieties FOR DELETE USING (true);
  END IF;
END $$;


-- ─── 4. Fix Categories Table RLS (Read + Write Access) ───────────────────────

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'Allow public read access on categories'
  ) THEN
    CREATE POLICY "Allow public read access on categories" ON public.categories FOR SELECT USING (true);
  END IF;
END $$;

-- Allow insert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'Allow admin insert on categories'
  ) THEN
    CREATE POLICY "Allow admin insert on categories" ON public.categories FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Allow update
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'Allow admin update on categories'
  ) THEN
    CREATE POLICY "Allow admin update on categories" ON public.categories FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Allow delete
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'Allow admin delete on categories'
  ) THEN
    CREATE POLICY "Allow admin delete on categories" ON public.categories FOR DELETE USING (true);
  END IF;
END $$;


-- ─── 5. Verification ─────────────────────────────────────────────────────────

SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('products', 'varieties', 'categories')
ORDER BY tablename, cmd;
