'use client';

import { useState, useEffect } from 'react';

// Holds the deferred prompt event between renders
let deferredPrompt: any = null;

/**
 * Detects and triggers the PWA install prompt.
 *
 * - On Android Chrome / Edge / Samsung Internet:
 *     `canInstall` becomes true once the browser fires `beforeinstallprompt`.
 *     Calling `install()` shows the native prompt.
 *
 * - On iOS Safari:
 *     `beforeinstallprompt` is never fired. `canInstall` stays false.
 *     Show users a manual instruction instead (e.g. "Tap Share → Add to Home Screen").
 *     You can detect iOS via `isIOS` if you want to show that hint separately.
 *
 * - Once the app is already installed (running in standalone mode),
 *     `canInstall` is always false.
 */
export function usePWAInstall() {
    const [canInstall, setCanInstall] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Detect iOS
        const ios =
            /iphone|ipad|ipod/i.test(navigator.userAgent) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        setIsIOS(ios);

        // Already installed → don't offer again
        if (window.matchMedia('(display-mode: standalone)').matches) return;

        const handler = (e: Event) => {
            e.preventDefault();           // prevent auto mini-infobar
            deferredPrompt = e;
            setCanInstall(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // If the user installs via the browser UI (not our button), clean up
        window.addEventListener('appinstalled', () => {
            deferredPrompt = null;
            setCanInstall(false);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const install = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setCanInstall(false);
        }
        deferredPrompt = null;
    };

    return { canInstall, install, isIOS };
}