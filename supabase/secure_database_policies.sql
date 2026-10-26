-- ==============================================================================
-- KSN SUPER STORE: SECURITY & ROW LEVEL SECURITY (RLS) POLICIES
-- Run this in Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- ─── 1. STORAGE: KEEP PRODUCT IMAGE BUCKET PUBLIC (PERMANENT IMAGES) ─────────
-- As requested, images remain 100% public so they never expire and require no yearly replacement.
-- Anyone can read/view product images; uploads/updates/deletes are protected.

-- Ensure bucket is set to public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'KSN super store';

-- Public read policy for storage objects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Allow public read access on KSN product images'
  ) THEN
    CREATE POLICY "Allow public read access on KSN product images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'KSN super store');
  END IF;
END $$;


-- ─── 2. ORDERS TABLE PRIVACY & ACCESS CONTROL ─────────────────────────────
-- Prevents unauthorized visitors from dumping all customer phone numbers and delivery addresses.

ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;

-- Allow customers to insert orders when placing an order (checkout)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'orders' 
      AND policyname = 'Allow customers to insert orders'
  ) THEN
    CREATE POLICY "Allow customers to insert orders"
    ON public.orders FOR INSERT
    WITH CHECK (true);
  END IF;
END $$;

-- Allow logged-in customers to view ONLY their own orders in their account page
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'orders' 
      AND policyname = 'Users can view their own orders'
  ) THEN
    CREATE POLICY "Users can view their own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;


-- ─── 3. CATALOG TABLES: PUBLIC READ ACCESS FOR VISITORS ──────────────────
-- Public customers need to browse products, categories, and varieties.

ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.varieties ENABLE ROW LEVEL SECURITY;

-- Allow public read access (SELECT) on categories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'categories' 
      AND policyname = 'Allow public read access on categories'
  ) THEN
    CREATE POLICY "Allow public read access on categories" 
    ON public.categories FOR SELECT 
    USING (true);
  END IF;
END $$;

-- Allow public read access (SELECT) on products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'products' 
      AND policyname = 'Allow public read access on products'
  ) THEN
    CREATE POLICY "Allow public read access on products" 
    ON public.products FOR SELECT 
    USING (true);
  END IF;
END $$;

-- Allow public read access (SELECT) on varieties
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'varieties' 
      AND policyname = 'Allow public read access on varieties'
  ) THEN
    CREATE POLICY "Allow public read access on varieties" 
    ON public.varieties FOR SELECT 
    USING (true);
  END IF;
END $$;


-- ─── 4. VERIFY APPLIED POLICIES ──────────────────────────────────────────
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
ORDER BY tablename, cmd;
