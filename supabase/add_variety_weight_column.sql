-- Add weight column to varieties table if not exists
ALTER TABLE public.varieties ADD COLUMN IF NOT EXISTS weight TEXT;

-- Add weight column to products table if not exists
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight TEXT;
