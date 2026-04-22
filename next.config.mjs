/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone para Railway/Docker
  output: process.env.RAILWAY_ENVIRONMENT ? 'standalone' : undefined,
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    return config;
  },
};

export default nextConfig;
