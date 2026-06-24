import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{
      protocol: 'https',
      hostname: 'rhcvidhxkpggalgcxgls.supabase.co',
    }],
  },
};

export default nextConfig;
