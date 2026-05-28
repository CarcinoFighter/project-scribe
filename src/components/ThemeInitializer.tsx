'use client';

import { useEffect } from 'react';
import { useUser } from '@/lib/useUser';
import {
  resolveSettings,
  saveSettings,
  applySettings,
} from '@/lib/theme';

/* ─────────────────────────────────────────────────────────────────── */
/*  ThemeInitializer                                                    */
/* ─────────────────────────────────────────────────────────────────── */

export function ThemeInitializer() {
  const { user, loading } = useUser();

  // ── Phase 1: Apply theme immediately on mount, even before auth ──
  // This prevents a flash of the wrong theme for logged-out users or
  // while the auth round-trip is in flight.
  useEffect(() => {
    const settings = resolveSettings();
    saveSettings(settings);
    applySettings(settings);
  }, []);

  // ── Phase 2: Re-apply once user data is available ──
  // If the user has server-side settings that differ from the local
  // cache, apply them now (this is the authoritative sync).
  useEffect(() => {
    if (loading) return;

    const metaSettings = user?.metadata?.settings as Record<string, unknown> | undefined;
    const settings = resolveSettings(metaSettings);
    saveSettings(settings);
    applySettings(settings);
  }, [user, loading]);

  // ── PWA: capture install prompt ──
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as Window & typeof globalThis & { deferredPrompt?: Event }).deferredPrompt = e;
      window.dispatchEvent(new Event('install-prompt-ready'));
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    };
  }, []);

  // ── PWA: fade out splash screen ──
  useEffect(() => {
    const splash = document.getElementById('pwa-splash');
    if (!splash) return;

    let fadeTimer: number | undefined;
    let hideTimer: number | undefined;

    const clearTimers = () => {
      if (fadeTimer) window.clearTimeout(fadeTimer);
      if (hideTimer) window.clearTimeout(hideTimer);
    };

    const showOffline = () => {
      clearTimers();
      splash.classList.add('is-offline');
      splash.style.opacity = '1';
      splash.style.display = 'flex';
    };

    const hideSplash = () => {
      splash.classList.remove('is-offline');
      fadeTimer = window.setTimeout(() => {
        splash.style.opacity = '0';
      }, 1500);
      hideTimer = window.setTimeout(() => {
        splash.style.display = 'none';
      }, 2200); // 1500ms delay + 700ms fade
    };

    const updateSplash = () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        showOffline();
        return;
      }
      hideSplash();
    };

    updateSplash();
    window.addEventListener('online', updateSplash);
    window.addEventListener('offline', updateSplash);

    return () => {
      clearTimers();
      window.removeEventListener('online', updateSplash);
      window.removeEventListener('offline', updateSplash);
    };
  }, []);

  return null; // This component doesn't render anything
}
