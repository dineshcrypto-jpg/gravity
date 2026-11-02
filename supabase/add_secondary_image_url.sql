-- Add secondary_image_url columns to products and varieties tables for 2-photo support (e.g. sarees)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS secondary_image_url TEXT;
ALTER TABLE public.varieties ADD COLUMN IF NOT EXISTS secondary_image_url TEXT;
