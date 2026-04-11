/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, type RuntimeCaching } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache as any[],
});

serwist.addEventListeners();

// Handle incoming push notifications
self.addEventListener('push', (event) => {
  let data: any = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (err) {
    console.error('Push data error:', err);
  }

  const title = data.title || 'Vantage';
  const options: any = {
    body: data.body || 'New notification',
    icon: '/pwa-icon-512.png',
    badge: '/pwa-icon-512.png',
    tag: data.tag || 'vantage-notification',
    data: data.data || { url: '/' },
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      // Broadcast to all open clients (tabs) to trigger a UI refresh
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({ type: 'PUSH_RECEIVED' });
        });
      })
    ])
  );
});

// Open the target URL when user taps the notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url: string = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList: readonly WindowClient[]) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});