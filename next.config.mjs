import withPWAInit from "@ducanh2912/next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wqhsgljvthewgcjjivga.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    turbopack: {},
  },
};

const isDev = process.env.NODE_ENV === "development";

export default isDev ? nextConfig : withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  customWorkers: "worker/push-handler.js",
})(nextConfig);