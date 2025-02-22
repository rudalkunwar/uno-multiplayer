// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,  // Enables React Strict Mode
  pageExtensions: ['tsx', 'ts'],  // Ensures that Next.js will handle TypeScript pages
  webpack(config: any, { isServer }: { isServer: boolean }) {
    // You can add custom webpack configurations here
    return config;
  },
};

module.exports = nextConfig;
