import withSerwistInit from "@serwist/next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
  // In this repo we rely on `tsc --noEmit` / CI for type safety.
  // Next's in-build typecheck can fail on newer Node runtimes in some environments.
  typescript: {
    ignoreBuildErrors: Number(process.versions.node.split(".")[0]) >= 23,
  },
  // Some restricted environments error when Next tries to spawn multiple build workers.
  // Keep builds functional by forcing a single worker on newer Node runtimes.
  experimental: {
    cpus: Number(process.versions.node.split(".")[0]) >= 23 ? 1 : undefined,
    workerThreads: Number(process.versions.node.split(".")[0]) >= 23,
  },
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
