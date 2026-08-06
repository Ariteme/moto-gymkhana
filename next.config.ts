import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone output only when building for Docker — Vercel has its own infra
  ...(process.env.BUILD_STANDALONE === '1' && { output: 'standalone' }),
  images: {
    remotePatterns: [{
      protocol: 'https',
      hostname: 'rhcvidhxkpggalgcxgls.supabase.co',
    }],
  },
};

export default nextConfig;
