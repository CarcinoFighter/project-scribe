'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    serwist: any;
  }
}

export default function SWRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator && window.serwist) {
      // serwist is injected by @serwist/next if register: true is set.
      // We don't necessarily need to call anything, but we can verify it's registered.
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          console.log('[pwa] service worker registered at scope:', registration.scope);
        } else {
          console.warn('[pwa] no service worker detected yet.');
        }
      });
    }
  }, []);

  return null;
}
