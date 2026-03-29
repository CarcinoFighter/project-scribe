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

    // Store PWA install prompt globally
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
      window.dispatchEvent(new Event('install-prompt-ready'));
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);

    // Fade out the PWA splash screen
    const splash = document.getElementById('pwa-splash');
    let hideTimer: NodeJS.Timeout;
    let timer: NodeJS.Timeout;
    if (splash) {
      timer = setTimeout(() => {
        splash.style.opacity = '0';
        hideTimer = setTimeout(() => {
          splash.style.display = 'none';
        }, 700);
      }, 1500); // Allow time for loading bar animation
    }
    
    return () => {
      if (timer) clearTimeout(timer);
      if (hideTimer) clearTimeout(hideTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    };
  }, []);

  return null; // This component doesn't render anything
}
