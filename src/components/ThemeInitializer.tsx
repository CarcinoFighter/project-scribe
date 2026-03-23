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

    // Fade out the PWA splash screen
    const splash = document.getElementById('pwa-splash');
    if (splash) {
      const timer = setTimeout(() => {
        splash.style.opacity = '0';
        const hideTimer = setTimeout(() => {
          splash.style.display = 'none';
        }, 700);
        return () => clearTimeout(hideTimer);
      }, 1500); // Allow time for loading bar animation
      return () => clearTimeout(timer);
    }
  }, []);

  return null; // This component doesn't render anything
}
