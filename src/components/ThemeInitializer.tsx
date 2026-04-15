'use client';

import { useEffect } from 'react';
import { useUser } from '@/lib/useUser';
import {
  loadSettings,
  saveSettings,
  applySettings,
  THEMES,
  type AppSettings,
} from './SettingsModal';

/* ─────────────────────────────────────────────────────────────────── */
/*  Helpers                                                             */
/* ─────────────────────────────────────────────────────────────────── */

/** Returns true if the OS/browser prefers a dark colour scheme. */
function devicePrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Resolves the right settings to apply on page load.
 *
 * Priority:
 *  1. If server-side user metadata contains settings → use those.
 *  2. If localStorage has a saved theme → use that.
 *  3. Otherwise → default to Vantage Dark / Light based on device pref.
 *
 * When a custom theme is active but has no matching light or dark
 * counterpart (e.g. 'dracula', 'monokai'), it remains intact — we
 * only apply the device-preference fallback when the user has never
 * explicitly picked a theme at all.
 */
function resolveSettings(userMeta?: Record<string, unknown>): AppSettings {
  const hasLocalSettings = localStorage.getItem('cs-settings') !== null;

  // User metadata from Supabase is the authoritative source.
  if (userMeta?.settings) {
    const metaSettings = userMeta.settings as Partial<AppSettings>;
    const base = loadSettings(); // merges with defaults
    return { ...base, ...metaSettings };
  }

  // Fall back to localStorage cache.
  if (hasLocalSettings) {
    return loadSettings();
  }

  // No saved preference anywhere → pick the Vantage default that
  // matches the device colour scheme.
  const base = loadSettings();
  return {
    ...base,
    theme: devicePrefersDark() ? 'default-dark' : 'default-light',
  };
}

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
    saveSettings(settings);  // persist resolved theme to localStorage
    applySettings(settings);
  }, []);

  // ── Phase 2: Re-apply once user data is available ──
  // If the user has server-side settings that differ from the local
  // cache, apply them now (this is the authoritative sync).
  useEffect(() => {
    if (loading) return;

    const meta = (user?.metadata ?? {}) as Record<string, unknown>;
    const settings = resolveSettings(meta);
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