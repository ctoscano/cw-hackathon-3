import path from "node:path";
import type { NextConfig } from "next";

const dataPackageSrc = path.resolve(__dirname, "../../packages/data/src");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@cw-hackathon/data"],

  // CRITICAL: Exclude build cache from serverless function bundles
  // The .next/cache directory contains 520+ MB of webpack build artifacts
  // that should NEVER be deployed to production
  outputFileTracingExcludes: {
    "*": [".next/cache/**", "cache/**", "**/.turbo/**", "**/*.tsbuildinfo"],
  },

  // Turbopack configuration (for dev:turbo and build:turbo)
  // Uses relative path from project root for Turbopack compatibility
  turbopack: {
    resolveAlias: {
      "@cw-hackathon/data": "../../packages/data/src/index.ts",
    },
    resolveExtensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
  },

  // Webpack configuration (for standard dev and build)
  webpack: (config) => {
    // Resolve .js imports to .ts files for workspace packages
    // This allows importing from source without pre-building
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
    };

    // Add workspace package source to module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      "@cw-hackathon/data": dataPackageSrc,
    };

    return config;
  },
};

export default nextConfig;
