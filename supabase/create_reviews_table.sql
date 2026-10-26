-- ==============================================================================
-- KSN SUPER STORE: REVIEWS TABLE & PERMANENT ACCOUNT-TIED OWNERSHIP
-- Run this in Supabase Dashboard -> SQL Editor
-- This ensures:
-- 1. Reviews are stored permanently in the database (never expire).
-- 2. ONLY the author of the review can edit or delete their own review.
-- 3. Nobody else (even admin or other users) can modify or delete another user's review.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    customer_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews (product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews (created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 1. PUBLIC READ: Anyone visiting the site can read customer reviews
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'reviews' 
      AND policyname = 'Allow public read access on reviews'
  ) THEN
    CREATE POLICY "Allow public read access on reviews"
    ON public.reviews FOR SELECT
    USING (true);
  END IF;
END $$;

-- 2. INSERT: Logged-in customers can submit reviews under their own account
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'reviews' 
      AND policyname = 'Users can only insert their own reviews'
  ) THEN
    CREATE POLICY "Users can only insert their own reviews"
    ON public.reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 3. EDIT (UPDATE): ONLY the specific account author can edit their review
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'reviews' 
      AND policyname = 'Users can only update their own reviews'
  ) THEN
    CREATE POLICY "Users can only update their own reviews"
    ON public.reviews FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 4. DELETE: ONLY the specific account author can delete their review
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'reviews' 
      AND policyname = 'Users can only delete their own reviews'
  ) THEN
    CREATE POLICY "Users can only delete their own reviews"
    ON public.reviews FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- 5. Verify the active policies for reviews
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'reviews'
ORDER BY cmd;
