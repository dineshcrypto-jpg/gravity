-- ==============================================================================
-- KSN SUPER STORE: CATEGORY UPDATES & ADDITIONS
-- 1. Fixes "Cooking Essentials" slug to 'cooking-essentials' (resolves 404 error)
-- 2. Adds "Pooja Essentials" (replaces 'pooja items' with modern, clear name)
-- 3. Adds "Other Essentials" (replaces 'other' with professional, clear name)
-- ==============================================================================

-- 1. FIX "Cooking Essentials" CATEGORY (ID: dde0e507-67da-4ec7-b279-32112d1f56d7)
-- Sets clean capitalized name and URL-safe slug 'cooking-essentials'
UPDATE public.categories
SET 
  name = 'Cooking Essentials',
  slug = 'cooking-essentials',
  icon = 'ShoppingBasket',
  color = 'bg-emerald-100 text-emerald-600',
  is_hidden = false
WHERE id = 'dde0e507-67da-4ec7-b279-32112d1f56d7'
   OR slug = 'cooking essentials'
   OR slug = 'cooking-essentials';


-- 2. ADD "Pooja Essentials" CATEGORY
-- Professional & immediately understood by customers
INSERT INTO public.categories (name, slug, icon, color, is_hidden)
VALUES (
  'Pooja Essentials',
  'pooja-essentials',
  'Flame',
  'bg-amber-100 text-amber-700',
  false
)
ON CONFLICT (slug) 
DO UPDATE SET 
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  is_hidden = false;


-- 3. ADD "Other Essentials" CATEGORY
-- Polished general merchandise department that maintains original meaning
INSERT INTO public.categories (name, slug, icon, color, is_hidden)
VALUES (
  'Other Essentials',
  'other-essentials',
  'Package',
  'bg-teal-100 text-teal-700',
  false
)
ON CONFLICT (slug) 
DO UPDATE SET 
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  is_hidden = false;


-- VERIFY ALL ACTIVE CATEGORIES:
SELECT id, name, slug, icon, color, is_hidden 
FROM public.categories 
ORDER BY name;
