import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse pulls in pdfjs-dist, which resolves a worker script path at runtime for a
  // Node.js "fake worker" fallback. Bundling it (Turbopack/webpack) breaks that path resolution
  // ("Cannot find module '.../pdf.worker.mjs'") — keep it as a plain Node require instead.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  // Static, infra-level redirects only (host canonicalization, permanent path renames baked into
  // the deploy). Content-team-managed redirects belong in the DB-backed Redirect model instead —
  // see src/lib/redirects.ts + the enforcement point in src/middleware.ts.
  async redirects() {
    return [
      // Canonical host (matches content `siteUrl`). Requires `www.torqstudio.com` as a domain in Vercel with valid SSL.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.torqstudio.com" }],
        destination: "https://torqstudio.com/:path*",
        permanent: true,
      },
      {
        source: "/hub/candidate/nodejs-interview",
        destination: "/hub/candidate/interview/nodejs",
        permanent: false,
      },
      {
        source: "/hub/candidate/nodejs-interview/:path*",
        destination: "/hub/candidate/interview/nodejs/:path*",
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        // Skip `/_next/*` so hashed CSS/JS chunks keep Next’s `Content-Type` (avoids nosniff + wrong MIME in dev).
        source: "/((?!_next/).*)",
        headers: [
          // SAMEORIGIN allows same-site iframes while blocking embeds on other domains.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Safe to set unconditionally — the site only ever serves over HTTPS (see the host
          // canonicalization redirect above). 2 years, applies to subdomains, eligible for preload.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
