import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#9875c1',
          light: '#b399d4',
          dark: '#7b5aa0',
          subtle: 'rgba(152,117,193,0.12)',
        },
        glass: {
          light: 'rgba(255,255,255,0.55)',
          dark: 'rgba(22,14,42,0.58)',
          border: 'rgba(152,117,193,0.2)',
          'border-light': 'rgba(152,117,193,0.15)',
        },
      },
      fontFamily: {
        sans: [
          'Google Sans Flex',
          'Google Sans',
          'DM Sans',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'app-dark':
          'radial-gradient(ellipse 80% 60% at 20% 10%, #1c0d32 0%, #0d0a14 45%, #0a0d1a 100%)',
        'app-light':
          'radial-gradient(ellipse 80% 60% at 80% 10%, #f5eeff 0%, #f0edf7 45%, #ebe4f5 100%)',
      },
      typography: ({ theme }: { theme: (path: string) => string }) => ({
        carcino: {
          css: {
            '--tw-prose-body': theme('colors.zinc.800'),
            '--tw-prose-headings': '#1a1025',
            '--tw-prose-links': '#9875c1',
            '--tw-prose-code': '#6a4a9a',
            '--tw-prose-pre-bg': '#f5f0fb',
            '--tw-prose-invert-body': '#d4c9e8',
            '--tw-prose-invert-headings': '#e8dff5',
            '--tw-prose-invert-links': '#b399d4',
            '--tw-prose-invert-code': '#c4a8e8',
            '--tw-prose-invert-pre-bg': 'rgba(22,14,42,0.8)',
            fontFamily:
              "'Google Sans Flex', 'Google Sans', 'DM Sans', sans-serif",
            lineHeight: '1.8',
            a: {
              color: '#9875c1',
              textDecorationColor: 'rgba(152,117,193,0.4)',
              '&:hover': { color: '#7b5aa0' },
            },
            code: {
              backgroundColor: 'rgba(152,117,193,0.1)',
              borderRadius: '4px',
              padding: '2px 6px',
              fontWeight: '400',
              '&::before': { content: 'none' },
              '&::after': { content: 'none' },
            },
            pre: {
              borderRadius: '10px',
              border: '1px solid rgba(152,117,193,0.2)',
            },
            blockquote: {
              borderLeftColor: '#9875c1',
              fontStyle: 'normal',
            },
            'h1,h2,h3,h4': { fontWeight: '700' },
            table: { borderRadius: '8px', overflow: 'hidden' },
            thead: { backgroundColor: 'rgba(152,117,193,0.08)' },
          },
        },
      }),
    },
  },
  plugins: [typography],
};

export default config;
