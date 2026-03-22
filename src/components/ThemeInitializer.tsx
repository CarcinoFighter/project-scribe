'use client';

import { useEffect } from 'react';
import { loadSettings, applySettings } from './SettingsModal';

/**
 * ThemeInitializer
 * Loads and applies the saved theme from localStorage on mount.
 * This runs on every page load to ensure theme persistence across refreshes.
 */
export function ThemeInitializer() {
  useEffect(() => {
    // Load settings from localStorage and apply the theme
    const settings = loadSettings();
    applySettings(settings);
  }, []);

  return null; // This component doesn't render anything
}
