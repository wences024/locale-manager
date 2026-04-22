/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output per Railway — sempre attivo così Nixpacks genera il server
  output: 'standalone',
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    return config;
  },
};

export default nextConfig;
