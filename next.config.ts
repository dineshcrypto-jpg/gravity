import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let supabaseHostname = '';
try {
  supabaseHostname = new URL(supabaseUrl).hostname;
} catch {
  // Will be empty if env var is not set
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      ...(supabaseHostname ? [{
        protocol: 'https' as const,
        hostname: supabaseHostname,
      }] : []),
      {
        protocol: 'https',
        hostname: 'placehold.co',
      }
    ],
    dangerouslyAllowSVG: true,
  },
};

export default nextConfig;

