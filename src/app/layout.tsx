import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeInitializer } from '@/components/ThemeInitializer';
import PushSubscriber from '@/components/PushSubscriber';
import { DM_Mono } from 'next/font/google';

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Vantage',
  description: 'A Beautiful Markdown Editor for Writers.',
  icons: {
    icon: '/logo.svg',
    // ── FIX 3: iOS Safari ignores SVG for apple-touch-icon — must be PNG ──
    apple: '/pwa-icon-512.png',
  },
  manifest: '/manifest.json?v=4',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Vantage',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0c0b0f',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={dmMono.className}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var settings = JSON.parse(localStorage.getItem('cs-settings') || '{}');
                  var theme = settings.theme || 'default-dark';
                  var isDark = theme.includes('dark') || theme.includes('mocha') || theme.includes('solarized');
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:ital,wght@0,100..700;1,100..700&family=JetBrains+Mono:wght@300..700&display=swap"
          rel="stylesheet"
        />
        {/* iOS Splash Screens */}
        <link rel="apple-touch-startup-image" href="/splash-640x1136.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash-750x1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash-1242x2208.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash-1125x2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash-1242x2688.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" />
      </head>
      <body>
        <div id="pwa-splash">
          <div className="splash-content">
            <img src="/logo.png" className="splash-logo" alt="logo" />
            <div className="splash-text">Vantage</div>
          </div>
          <div className="splash-loader-container">
            <div className="splash-loader-bar"></div>
          </div>
        </div>
        <ThemeInitializer />
        <PushSubscriber />
        {children}
      </body>
    </html>
  );
}