-- ==============================================================================
-- KSN SUPER STORE: SUPABASE MIGRATION SCRIPT
-- 1. Adds 'is_hidden' column to categories so you can hide/unhide any category
-- 2. Makes the storage bucket permanent & public so images NEVER expire
-- 3. Converts all existing expiring signed URLs into permanent public URLs
-- ==============================================================================

-- 1. ADD 'is_hidden' COLUMN TO CATEGORIES TABLE
-- In your Supabase Dashboard -> Table Editor -> categories:
-- Check/uncheck 'is_hidden' (true = hidden from site, false = visible).
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false NOT NULL;


-- 2. MAKE STORAGE BUCKET PUBLIC (PREVENTS EXPIRATION FOREVER)
-- This ensures Supabase never generates temporary expired tokens for your images.
UPDATE storage.buckets 
SET public = true 
WHERE id = 'KSN super store' OR name = 'KSN super store';

-- Allow anyone on web/mobile to view images in this bucket without expiration tokens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Allow public read access on KSN super store'
  ) THEN
    CREATE POLICY "Allow public read access on KSN super store"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'KSN super store');
  END IF;
END $$;


-- 3. CONVERT EXISTING EXPIRING SIGNED URLS INTO PERMANENT PUBLIC URLS
-- This replaces '/object/sign/' with '/object/public/' and strips '?token=...'
UPDATE public.products
SET image_url = regexp_replace(
  replace(image_url, '/storage/v1/object/sign/', '/storage/v1/object/public/'),
  '\?token=.*$',
  ''
)
WHERE image_url LIKE '%/storage/v1/object/sign/%';

UPDATE public.varieties
SET image_url = regexp_replace(
  replace(image_url, '/storage/v1/object/sign/', '/storage/v1/object/public/'),
  '\?token=.*$',
  ''
)
WHERE image_url LIKE '%/storage/v1/object/sign/%';
