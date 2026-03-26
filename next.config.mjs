import withSerwistInit from "@serwist/next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
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
};

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Disable in dev (Turbopack doesn't support Serwist's webpack plugin)
  disable: process.env.NODE_ENV !== "production",
  register: true,
  reloadOnOnline: true,
});

export default withSerwist(nextConfig);