-- ==============================================================================
-- KSN SUPER STORE: ENABLE ADMIN WRITE ACCESS
-- Run this in Supabase Dashboard -> SQL Editor (one-time setup)
-- This allows the admin panel to insert, update, and delete products/categories/varieties
-- ==============================================================================

-- ─── Products: Allow insert, update, delete via anon key ─────────
-- (Your admin panel uses the anon key with a passcode gate on the frontend)

CREATE POLICY "Allow public insert on products"
ON public.products FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update on products"
ON public.products FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public delete on products"
ON public.products FOR DELETE
USING (true);


-- ─── Categories: Allow insert, update, delete ────────────────────

CREATE POLICY "Allow public insert on categories"
ON public.categories FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update on categories"
ON public.categories FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public delete on categories"
ON public.categories FOR DELETE
USING (true);


-- ─── Varieties: Enable RLS + allow all operations ────────────────

ALTER TABLE public.varieties ENABLE ROW LEVEL SECURITY;

-- Read access (may already exist - safe to run)
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

CREATE POLICY "Allow public insert on varieties"
ON public.varieties FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update on varieties"
ON public.varieties FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public delete on varieties"
ON public.varieties FOR DELETE
USING (true);


-- ─── Verify policies are set ─────────────────────────────────────
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
