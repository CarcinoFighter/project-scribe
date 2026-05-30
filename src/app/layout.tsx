import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeInitializer } from '@/components/ThemeInitializer';
import PushSubscriber from '@/components/PushSubscriber';
import SWRegistration from '@/components/SWRegistration';
import { getThemeBootstrapScript } from '@/lib/theme';

export const metadata: Metadata = {
  title: 'Vantage',
  description: 'A Premium Markdown Editor for focused writing.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/logo.svg',
    apple: '/pwa-icon-512.png',
  },
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
    <html lang="en" suppressHydrationWarning>
      <head>
        
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
      
      <script dangerouslySetInnerHTML={{ __html: getThemeBootstrapScript() }} />
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
        <SWRegistration />
        <PushSubscriber />
        {children}
      </body>
    </html>
  );
}
