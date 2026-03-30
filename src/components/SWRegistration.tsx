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
      if (process.env.NODE_ENV !== 'production') return;

      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none',
          });
          console.log('[pwa] Service Worker registered:', registration.scope);
        } catch (error) {
          console.warn('[pwa] Service Worker registration failed:', error);
        }
      };

      registerSW();
    }
  }, []);

  return null;
}
