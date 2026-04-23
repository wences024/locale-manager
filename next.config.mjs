/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output per Railway — sempre attivo così Nixpacks genera il server
  output: 'standalone',
  webpack: (config, { isServer }) => {
    config.resolve.fallback = { fs: false };
    // pdf-parse usa moduli Node.js nativi — escludi dal bundle client
    if (!isServer) {
      config.externals = [...(config.externals || []), 'pdf-parse'];
    }
    return config;
  },
  // Forza pdf-parse come modulo server-only
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;
