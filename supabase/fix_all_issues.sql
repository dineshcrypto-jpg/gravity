-- ==============================================================================
-- KSN SUPER STORE: ONE-CLICK SQL FIX SCRIPT
-- ==============================================================================
-- Run this in your Supabase Dashboard -> SQL Editor (Click 'Run' or press Ctrl+Enter)
-- This fixes:
--   1. Realtime Order Notifications (Adds 'orders' to supabase_realtime publication)
--   2. Missing 'offers' table (Eliminates the 404 / 'No API key' error)
--   3. Guarantees Order read/write access for checkout and admin order tracking
-- ==============================================================================

-- ─── 1. REALTIME NOTIFICATIONS ON ORDERS ─────────────────────────────────────
-- Required for Supabase to broadcast instant popups and chime rings when orders arrive
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback for environments where publication table alter has different syntax
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
END $$;


-- ─── 2. CREATE OFFERS TABLE (Fixes 404 error) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    badge TEXT DEFAULT 'SPECIAL OFFER',
    image_url TEXT,
    link_url TEXT DEFAULT '/products',
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on offers
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Allow public read access on offers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'offers' 
      AND policyname = 'Allow public read access on offers'
  ) THEN
    CREATE POLICY "Allow public read access on offers"
    ON public.offers FOR SELECT
    USING (true);
  END IF;
END $$;

-- Allow insert/update/delete on offers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'offers' 
      AND policyname = 'Allow admin insert on offers'
  ) THEN
    CREATE POLICY "Allow admin insert on offers"
    ON public.offers FOR INSERT
    WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'offers' 
      AND policyname = 'Allow admin update on offers'
  ) THEN
    CREATE POLICY "Allow admin update on offers"
    ON public.offers FOR UPDATE
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'offers' 
      AND policyname = 'Allow admin delete on offers'
  ) THEN
    CREATE POLICY "Allow admin delete on offers"
    ON public.offers FOR DELETE
    USING (true);
  END IF;
END $$;


-- ─── 3. ORDERS TABLE ACCESS POLICIES ─────────────────────────────────────────
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'orders' 
      AND policyname = 'Allow public insert on orders'
  ) THEN
    CREATE POLICY "Allow public insert on orders"
    ON public.orders FOR INSERT
    WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'orders' 
      AND policyname = 'Allow admin view on orders'
  ) THEN
    CREATE POLICY "Allow admin view on orders"
    ON public.orders FOR SELECT
    USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'orders' 
      AND policyname = 'Allow admin update on orders'
  ) THEN
    CREATE POLICY "Allow admin update on orders"
    ON public.orders FOR UPDATE
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;


-- ─── 4. VERIFY EVERYTHING ───────────────────────────────────────────────────
SELECT pubname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
