import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@cw-hackathon/data"],
};

export default nextConfig;
