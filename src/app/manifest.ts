import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: 'carcino-vantage',
    name: 'Carcino Vantage',
    short_name: 'Vantage',
    description: 'A powerful and centralised platform for the Carcino Team.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0c0b0f',
    theme_color: '#0c0b0f',
    orientation: 'any',
    categories: ['productivity', 'utilities'],
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
