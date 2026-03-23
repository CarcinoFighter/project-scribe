'use client';

import { useEffect } from 'react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/**
 * Hook that requests push permission and registers the subscription with the server.
 * Call inside a component that only renders when the user is authenticated.
 */
export function usePushSubscription() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (!VAPID_PUBLIC_KEY) return;

    // Don't prompt again if already granted/denied
    if (Notification.permission === 'denied') return;

    async function subscribe() {
      try {
        const registration = await navigator.serviceWorker.ready;

        // Check if already subscribed
        const existing = await registration.pushManager.getSubscription();
        if (existing) {
          // Re-register with server in case it expired
          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(existing.toJSON()),
            credentials: 'include',
          });
          return;
        }

        // Request permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        // Subscribe
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        // Send to server
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription.toJSON()),
          credentials: 'include',
        });
      } catch (err) {
        console.warn('[push] subscription failed:', err);
      }
    }

    // Small delay so it doesn't race with page load
    const timer = setTimeout(subscribe, 3000);
    return () => clearTimeout(timer);
  }, []);
}
