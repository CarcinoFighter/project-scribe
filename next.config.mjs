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
  // Serwist's injectManifest plugin is currently incompatible with Turbopack (next dev --turbo).
  // To test PWA/Push notifications, run: npm run build && npm run start
  disable: process.env.NODE_ENV !== "production",
  register: false,
  reloadOnOnline: true,
});

export default withSerwist(nextConfig);