'use client';

import { useEffect } from 'react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function requestPushSubscription(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  if (!VAPID_PUBLIC_KEY) return false;

  if (Notification.permission === 'denied') return false;

  try {
    // Get current registration without waiting indefinitely if missing (e.g. dev mode)
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      console.warn('[push] No active service worker registration found.');
      return false;
    }

    // Check if already subscribed
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(existing.toJSON()),
        credentials: 'include',
      });
      return true;
    }

    // Request permission (requires user gesture on mobile)
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    // Subscribe
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as any,
    });

    // Send to server
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription.toJSON()),
      credentials: 'include',
    });
    return true;
  } catch (err) {
    console.warn('[push] subscription failed:', err);
    return false;
  }
}

/**
 * Hook that registers the subscription with the server if permission is already granted.
 * Avoids prompting the user automatically to comply with mobile browser rules.
 */
export function usePushSubscription() {
  useEffect(() => {
    // Only auto-subscribe if we already have permission.
    // If not, we wait for a click handler to call requestPushSubscription().
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const timer = setTimeout(requestPushSubscription, 3000);
      return () => clearTimeout(timer);
    }
  }, []);
}
