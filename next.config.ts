import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Serve WebP only — no AVIF. This ensures the preloader caches the same
    // format the browser will request at render time (consistent cache hits).
    formats: ['image/webp'],
  },
};

export default nextConfig;
