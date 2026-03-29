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
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none',
          });
          console.log('[pwa] Service Worker registered:', registration.scope);
        } catch (error) {
          console.error('[pwa] Service Worker registration failed:', error);
        }
      };

      // Always try to register/verify the service worker on mount to ensure installability
      registerSW();
    }
  }, []);

  return null;
}
