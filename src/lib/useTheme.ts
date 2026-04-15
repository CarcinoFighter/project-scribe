/**
 * useTheme — centralized theme management hook
 *
 * Single source of truth for dark/light state across all pages.
 * Uses loadSettings / applySettings / saveSettings from SettingsModal
 * so theme changes are always persisted in 'cs-settings' and applied
 * consistently via CSS variable injection on <html>.
 *
 * Theme resolution order:
 *  1. If the user has a saved theme in localStorage → use it.
 *  2. Otherwise → pick 'default-dark' or 'default-light' based on
 *     the device's prefers-color-scheme media query.
 *
 * Toggle behaviour:
 *  - If the active theme has a registered dark↔light pair, switch to it.
 *  - If not (e.g. 'dracula', 'monokai'), fall back to the corresponding
 *    Vantage default ('default-dark' ↔ 'default-light') so nothing
 *    ever breaks.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  loadSettings,
  saveSettings,
  applySettings,
  THEMES,
  DEFAULT_SETTINGS,
  type AppSettings,
} from '@/components/SettingsModal';

/* ─────────────────────────────────────────────────────────────────── */
/*  Dark ↔ Light theme pairs                                           */
/*                                                                     */
/*  Only themes that have a true counterpart live here.               */
/*  Single-mode themes (darcula, monokai, …) are intentionally absent */
/*  so the toggle naturally falls back to the Vantage defaults.       */
/*  Add a new entry here whenever a paired theme is added to          */
/*  SettingsModal.                                                     */
/* ─────────────────────────────────────────────────────────────────── */
export const DARK_TO_LIGHT: Record<string, string> = {
  'default-dark':     'default-light',
  'catppuccin-mocha': 'catppuccin-latte',
  'solarized-dark':   'solarized-light',
  'gruvbox-dark':     'gruvbox-light',
};

export const LIGHT_TO_DARK: Record<string, string> = Object.fromEntries(
  Object.entries(DARK_TO_LIGHT).map(([dark, light]) => [light, dark])
);

/* ─────────────────────────────────────────────────────────────────── */
/*  Helpers                                                             */
/* ─────────────────────────────────────────────────────────────────── */

/** Returns true if the OS/browser prefers a dark colour scheme. */
function devicePrefersDark(): boolean {
  if (typeof window === 'undefined') return true; // SSR-safe default
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Resolves the initial theme to apply on first load.
 *
 * - If the user has already saved a theme preference, use it as-is.
 * - Otherwise, pick the Vantage default that matches the device theme.
 */
function resolveInitialTheme(): AppSettings {
  const saved = loadSettings();

  // If the user has explicitly chosen a theme (i.e. it differs from
  // the compile-time DEFAULT_SETTINGS value), honour it unconditionally.
  const hasExplicitTheme =
    typeof window !== 'undefined' &&
    localStorage.getItem('cs-settings') !== null;

  if (hasExplicitTheme) return saved;

  // No saved preference → use device colour scheme.
  const deviceTheme = devicePrefersDark() ? 'default-dark' : 'default-light';
  return { ...saved, theme: deviceTheme };
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Types                                                               */
/* ─────────────────────────────────────────────────────────────────── */
export interface ThemeState {
  /** true when the active theme is a dark variant */
  isDark: boolean;
  /** Toggle between dark/light, picking the paired theme when possible */
  toggleTheme: () => void;
  /** Fully replace the active theme (e.g. from SettingsModal) */
  setTheme: (themeId: string) => void;
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Hook                                                                */
/* ─────────────────────────────────────────────────────────────────── */
export function useTheme(): ThemeState {
  const [isDark, setIsDark] = useState(false);

  // On mount: resolve the correct initial theme and apply it.
  useEffect(() => {
    const initialSettings = resolveInitialTheme();

    // Persist the resolved theme so subsequent loads skip the
    // device-detection step (user's explicit override wins from now on
    // only if they interact with the theme selector).
    saveSettings(initialSettings);

    const dark = applySettings(initialSettings);
    setIsDark(dark);

    // Also listen for OS theme changes so the app stays in sync when
    // the user hasn't picked an explicit theme yet.
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // Only react if the user hasn't manually set a theme.
      const current = loadSettings();
      const isVantageDefault =
        current.theme === 'default-dark' || current.theme === 'default-light';

      if (isVantageDefault) {
        const next: AppSettings = {
          ...current,
          theme: e.matches ? 'default-dark' : 'default-light',
        };
        saveSettings(next);
        setIsDark(applySettings(next));
      }
    };

    mq.addEventListener('change', handleSystemThemeChange);
    return () => mq.removeEventListener('change', handleSystemThemeChange);
  }, []);

  /**
   * Toggles between the dark and light variants of the current theme.
   *
   * Fallback matrix:
   *  - Paired dark theme   → its registered light counterpart
   *  - Paired light theme  → its registered dark counterpart
   *  - Unpaired dark theme → 'default-light'  (Vantage fallback)
   *  - Unpaired light theme→ 'default-dark'   (Vantage fallback)
   */
  const toggleTheme = useCallback(() => {
    const s = loadSettings();
    const themeConfig = THEMES[s.theme];

    // If theme ID is somehow invalid, fall back to the device default.
    if (!themeConfig) {
      const fallback: AppSettings = {
        ...s,
        theme: devicePrefersDark() ? 'default-dark' : 'default-light',
      };
      saveSettings(fallback);
      setIsDark(applySettings(fallback));
      return;
    }

    const currentIsDark = themeConfig.dark;

    const nextThemeId = currentIsDark
      ? (DARK_TO_LIGHT[s.theme] ?? 'default-light')   // dark → light pair or Vantage light
      : (LIGHT_TO_DARK[s.theme] ?? 'default-dark');   // light → dark pair or Vantage dark

    const next: AppSettings = { ...s, theme: nextThemeId };
    saveSettings(next);
    setIsDark(applySettings(next));
  }, [isDark]);

  /** Directly sets a theme by ID (called from SettingsModal). */
  const setTheme = useCallback((themeId: string) => {
    const s = loadSettings();

    // If the requested theme ID doesn't exist in THEMES, fall back to
    // the appropriate Vantage default rather than applying nothing.
    const resolvedId = THEMES[themeId]
      ? themeId
      : devicePrefersDark()
        ? 'default-dark'
        : 'default-light';

    const next: AppSettings = { ...s, theme: resolvedId };
    saveSettings(next);
    setIsDark(applySettings(next));
  }, []);

  return { isDark, toggleTheme, setTheme };
}