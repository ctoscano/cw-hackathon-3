import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@cw-hackathon/data"],

  // CRITICAL: Exclude build cache from serverless function bundles
  // The .next/cache directory contains 520+ MB of webpack build artifacts
  // that should NEVER be deployed to production
  outputFileTracingExcludes: {
    "*": [".next/cache/**", "cache/**", "**/.turbo/**", "**/*.tsbuildinfo"],
  },
};

export default nextConfig;
