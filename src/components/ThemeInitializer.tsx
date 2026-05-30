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

    const fadeTimer = setTimeout(() => {
      splash.style.opacity = '0';
    }, 1500);

    const hideTimer = setTimeout(() => {
      splash.style.display = 'none';
    }, 2200); // 1500ms delay + 700ms fade

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return null; // This component doesn't render anything
}
