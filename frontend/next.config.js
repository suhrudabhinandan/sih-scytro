/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Handle browser APIs and external packages
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      path: false,
      crypto: false
    };

    return config;
  }
}

module.exports = nextConfig
