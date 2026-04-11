'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    serwist: any;
  }
}

export default function SWRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Only register in production as Serwist is disabled in dev by default
      if (process.env.NODE_ENV !== 'production') {
        console.info('[pwa] Service Worker registration skipped in development mode. Build the project locally with `npm run build && npm run start` to test push notifications.');
        return;
      }

      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none',
          });
          console.log('[pwa] Service Worker registered successfully:', registration.scope);
        } catch (error) {
          console.error('[pwa] Service Worker registration failed:', error);
        }
      };

      registerSW();
    }
  }, []);

  return null;
}
