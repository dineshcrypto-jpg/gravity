-- ==============================================================================
-- KSN SUPER STORE: OFFERS & FREEBIES TABLE
-- Run this in Supabase Dashboard -> SQL Editor
-- This allows admins to create, edit, and toggle offers (like Free Matchbox, 1+1 Deals)
-- which are displayed directly to customers on the website homepage!
-- ==============================================================================

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

-- Enable Row Level Security (RLS)
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Policy: Customers can see all active offers
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

-- 2. Admin Insert / Update / Delete policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'offers' 
      AND policyname = 'Allow public insert on offers'
  ) THEN
    CREATE POLICY "Allow public insert on offers"
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
      AND policyname = 'Allow public update on offers'
  ) THEN
    CREATE POLICY "Allow public update on offers"
    ON public.offers FOR UPDATE
    USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'offers' 
      AND policyname = 'Allow public delete on offers'
  ) THEN
    CREATE POLICY "Allow public delete on offers"
    ON public.offers FOR DELETE
    USING (true);
  END IF;
END $$;

-- Insert initial sample offers
INSERT INTO public.offers (title, description, badge, image_url, link_url, is_active)
VALUES 
(
  'Free Matchbox on Cooking Essentials',
  'Buy any Cooking Oil (1L+) or 500g Masala packet & get 1 Homelite Matchbox Free!',
  'FREE GIFT',
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=400&h=400&auto=format&fit=crop',
  '/categories/cooking-essentials',
  true
),
(
  '1 + 1 Buy 1 Get 1 Free Deals',
  'Double your savings with Buy 1 Get 1 Free on select biscuits, tea & pantry snacks!',
  '1 + 1 FREE',
  'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&h=400&auto=format&fit=crop',
  '/products',
  true
);
