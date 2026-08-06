import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone mode copies only production dependencies into .next/standalone
  // so Docker images don't need node_modules (much smaller image)
  output: 'standalone',
  images: {
    remotePatterns: [{
      protocol: 'https',
      hostname: 'rhcvidhxkpggalgcxgls.supabase.co',
    }],
  },
};

export default nextConfig;
