import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  experimental: {
    cpus: 2,
  },
  poweredByHeader: false,
  images: {
    // Reuse optimized images across visits instead of reprocessing them frequently.
    // Replaced remote images should use a new/versioned URL.
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "www.pexels.com",
      },
      {
        protocol: "https",
        hostname: "pexels.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
    ],
  },
  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      {
        key: "Content-Security-Policy",
        value:
          "frame-src 'self' https://www.youtube-nocookie.com; script-src 'self' 'unsafe-inline' https://www.youtube.com https://www.youtube-nocookie.com" +
          (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),
      },
    ];

    if (process.env.NODE_ENV === "production") {
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // Only bundled public artwork is shareable. Pages and API responses can
        // contain account data and must retain Next.js's own cache policy.
        source: "/:folder(consultation|contact|courses|hero|images|newsletter|testimonials|owner%20image)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600",
          },
        ],
      },
      {
        source: "/:asset(logo\\.png|logo\\.jpeg|image\\.png)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
