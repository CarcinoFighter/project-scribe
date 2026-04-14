/**
 * useTheme — centralized theme management hook
 *
 * Single source of truth for dark/light state across all pages.
 * Uses loadSettings / applySettings / saveSettings from SettingsModal
 * so theme changes are always persisted in 'cs-settings' and applied
 * consistently via CSS variable injection on <html>.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  loadSettings,
  saveSettings,
  applySettings,
  THEMES,
} from '@/components/SettingsModal';

/**
 * Dark ↔ Light theme pairs.
 * Themes listed here toggle to their counterpart; all other themes
 * fall back to default-light (if dark) or default-dark (if light).
 * Extend here whenever a new paired theme is added to SettingsModal.
 */
export const DARK_TO_LIGHT: Record<string, string> = {
  'default-dark':     'default-light',
  'catppuccin-mocha': 'catppuccin-latte',
  'solarized-dark':   'solarized-light',
  'gruvbox-dark':     'gruvbox-light',
};
export const LIGHT_TO_DARK: Record<string, string> = Object.fromEntries(
  Object.entries(DARK_TO_LIGHT).map(([k, v]) => [v, k])
);

export interface ThemeState {
  /** true when the active theme is a dark variant */
  isDark: boolean;
  /** Toggle between dark/light, picking the paired theme when possible */
  toggleTheme: () => void;
  /** Fully replace the active theme (e.g. from SettingsModal) */
  setTheme: (themeId: string) => void;
}

export function useTheme(): ThemeState {
  const [isDark, setIsDark] = useState(false);

  // On mount: load saved settings and apply them
  useEffect(() => {
    const s = loadSettings();
    const dark = applySettings(s);
    setIsDark(dark);
  }, []);

  const toggleTheme = useCallback(() => {
    const s = loadSettings();
    const currentIsDark = THEMES[s.theme]?.dark ?? isDark;

    const nextThemeId = currentIsDark
      ? (DARK_TO_LIGHT[s.theme] ?? 'default-light')
      : (LIGHT_TO_DARK[s.theme] ?? 'default-dark');

    const next = { ...s, theme: nextThemeId };
    saveSettings(next);
    setIsDark(applySettings(next));
  }, [isDark]);

  const setTheme = useCallback((themeId: string) => {
    const s = loadSettings();
    const next = { ...s, theme: themeId };
    saveSettings(next);
    setIsDark(applySettings(next));
  }, []);

  return { isDark, toggleTheme, setTheme };
}