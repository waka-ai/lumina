/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: false,
  experimental: {
    swcPlugins: [],
  },
  webpack(config) {
    return config;
  },
};

export default nextConfig;

