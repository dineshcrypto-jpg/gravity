-- Optional Supabase Table for Web Push Subscriptions
-- Run this in your Supabase SQL Editor to store push subscriptions permanently in the database.
-- (Note: Even without running this, local backup storage will work automatically.)

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint TEXT UNIQUE NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous/service role insert, select, and delete for push operations
CREATE POLICY "Allow anon read/write push subscriptions" 
ON public.push_subscriptions 
FOR ALL 
TO anon, authenticated
USING (true)
WITH CHECK (true);
