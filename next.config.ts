import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Keep module resolution rooted here, where Next.js is installed.
    root: __dirname,
  },
};

export default nextConfig;
