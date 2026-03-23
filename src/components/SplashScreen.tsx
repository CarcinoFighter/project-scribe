'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

/**
 * SplashScreen Component
 * Provides a premium, full-screen transition for the PWA on initial load.
 * Utilizes the same branding as the manifest and startup images.
 */
export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Shorter delay for the initial load feel, matching the PWA startup experience
    const timer = setTimeout(() => {
      setIsFading(true);
      // Wait for the fade animation to complete before removing from DOM
      const removeTimer = setTimeout(() => {
        setIsVisible(false);
      }, 800);
      return () => clearTimeout(removeTimer);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0c0b0f',
        transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: isFading ? 0 : 1,
        pointerEvents: 'none',
      }}
    >
      {/* Centered Logo with Pulse Animation */}
      <div
        style={{
          width: 80,
          height: 80,
          position: 'relative',
          animation: 'pwaScaleIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both, pwaPulse 2s ease-in-out infinite 0.8s',
        }}
      >
        <Image
          src="/logo.png"
          alt="Vantage"
          fill
          priority
          style={{ objectFit: 'contain' }}
        />
      </div>

      <div
        style={{
          marginTop: 24,
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'rgba(255, 255, 255, 0.7)',
          animation: 'pwaFadeUp 0.8s cubic-bezier(0.25, 1, 0.5, 1) both 0.3s',
        }}
      >
        Vantage
      </div>

      <style jsx global>{`
        @keyframes pwaPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.85; }
        }
        @keyframes pwaScaleIn {
          from { transform: scale(0.6); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes pwaFadeUp {
          from { transform: translateY(12px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
