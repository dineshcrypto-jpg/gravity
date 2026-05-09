import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'pjqafelkgwupljcqspnv.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      }
    ],
    dangerouslyAllowSVG: true,
  },
};

export default nextConfig;
