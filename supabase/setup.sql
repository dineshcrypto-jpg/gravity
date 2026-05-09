-- Create Categories Table
CREATE TABLE public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT, -- e.g., 'Apple', 'Smartphone' (matches our Lucide icons)
    color TEXT, -- e.g., 'bg-green-100 text-green-600'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Products Table
CREATE TABLE public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    image_url TEXT,
    is_in_stock BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
-- This allows anyone to READ the products and categories, but only admins (or you from the dashboard) can edit them.
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access
CREATE POLICY "Allow public read access on categories" 
ON public.categories FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access on products" 
ON public.products FOR SELECT 
USING (true);

-- Insert initial dummy categories
INSERT INTO public.categories (name, slug, icon, color) VALUES 
('Groceries', 'groceries', 'Apple', 'bg-green-100 text-green-600'),
('Electronics', 'electronics', 'Smartphone', 'bg-blue-100 text-blue-600'),
('Fashion', 'fashion', 'Shirt', 'bg-purple-100 text-purple-600'),
('Home & Kitchen', 'home', 'Coffee', 'bg-orange-100 text-orange-600'),
('Beauty', 'beauty', 'Sparkles', 'bg-pink-100 text-pink-600'),
('Toys', 'toys', 'Gamepad2', 'bg-yellow-100 text-yellow-600');
