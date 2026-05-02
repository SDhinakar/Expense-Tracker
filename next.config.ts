import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Strict mode catches side-effect bugs early in dev without affecting prod
  reactStrictMode: true,

  // Tree-shake heavy packages to only include what's actually imported
  experimental: {
    optimizePackageImports: [
      "framer-motion",
      "recharts",
      "lucide-react",
      "@radix-ui/react-icons",
      "date-fns",
    ],
  },

  // Compress responses (gzip) — default true in prod, making it explicit
  compress: true,

  images: {
    // Allow avatar images from common OAuth providers if added later
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
}

export default nextConfig
