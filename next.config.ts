import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Prefer AVIF then WebP when the browser supports them. The original JPG
    // is always available as fallback. This matters most on the PDP scroller
    // where a single project can have 15+ source photos at 4–7 MB each.
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
