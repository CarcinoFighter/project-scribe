'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Palette, Type, Monitor, Eye, Sliders, Keyboard, Check } from 'lucide-react';
import { requestPushSubscription } from '@/lib/usePushSubscription';

/* ─────────────────────────────────────────────────────────── */
/*  Types                                                       */
/* ─────────────────────────────────────────────────────────── */
export interface AppSettings {
  theme: string;
  accentColor: string;
  editorFont: string;
  editorFontSize: number;
  lineHeight: number;
  uiFont: string;
  wordWrap: boolean;
  lineNumbers: boolean;
  highlightActiveLine: boolean;
  showMinimap: boolean;
  tabSize: number;
  spellcheck: boolean;
  autoSave: boolean;
  maxWidth: number;
  focusFade: number;
  zenToolbar: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'default-dark',
  accentColor: '#9875c1',
  editorFont: 'google-sans',
  editorFontSize: 15,
  lineHeight: 1.75,
  uiFont: 'google-sans',
  wordWrap: true,
  lineNumbers: true,
  highlightActiveLine: true,
  showMinimap: false,
  tabSize: 2,
  spellcheck: true,
  autoSave: true,
  maxWidth: 740,
  focusFade: 40,
  zenToolbar: false,
  reducedMotion: false,
  highContrast: false,
};

/* ─────────────────────────────────────────────────────────── */
/*  Themes — every theme defines ALL required vars explicitly   */
/* ─────────────────────────────────────────────────────────── */
export const THEMES: Record<string, { label: string; dark: boolean; vars: Record<string, string> }> = {
  'default-light': {
    label: 'Vantage Light', dark: false,
    vars: {
      '--bg': '#ffffff', '--bg-alt': '#f7f7f7', '--bg-deep': '#f0f0f0',
      '--text': '#0a0a0a', '--text-2': '#2a2a2a', '--text-3': '#3a3a3a', '--text-4': '#636363',
      '--surface-0': 'rgba(255,255,255,0.72)', '--surface-1': 'rgba(255,255,255,0.88)', '--surface-2': 'rgba(255,255,255,0.97)',
      '--border': 'rgba(0,0,0,0.09)', '--border-med': 'rgba(0,0,0,0.14)', '--border-strong': 'rgba(0,0,0,0.22)',
      '--surface-sidebar': 'rgba(238,238,238,0.94)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.06)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.10),0 2px 6px rgba(0,0,0,0.06)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.14),0 2px 10px rgba(0,0,0,0.07)',
    },
  },
  'default-dark': {
    label: 'Vantage Dark', dark: true,
    vars: {
      '--bg': '#0a0a0a', '--bg-alt': '#111111', '--bg-deep': '#181818',
      '--text': '#f0f0f0', '--text-2': '#d0d0d0', '--text-3': '#b8b8b8', '--text-4': '#787878',
      '--surface-0': 'rgba(16,16,16,0.75)', '--surface-1': 'rgba(22,22,22,0.88)', '--surface-2': 'rgba(28,28,28,0.97)',
      '--border': 'rgba(255,255,255,0.10)', '--border-med': 'rgba(255,255,255,0.16)', '--border-strong': 'rgba(255,255,255,0.26)',
      '--surface-sidebar': 'rgba(20,20,20,0.96)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.35)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.45)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.55)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.65)',
    },
  },
  'catppuccin-mocha': {
    label: 'Catppuccin Mocha', dark: true,
    vars: {
      '--bg': '#1e1e2e', '--bg-alt': '#181825', '--bg-deep': '#11111b',
      '--text': '#cdd6f4', '--text-2': '#bac2de', '--text-3': '#a6adc8', '--text-4': '#7f849c',
      '--surface-0': 'rgba(30,30,46,0.80)', '--surface-1': 'rgba(36,36,54,0.92)', '--surface-2': 'rgba(42,42,62,0.98)',
      '--border': 'rgba(205,214,244,0.10)', '--border-med': 'rgba(205,214,244,0.16)', '--border-strong': 'rgba(205,214,244,0.24)',
      '--surface-sidebar': 'rgba(17,17,27,0.97)',
      '--accent': '#cba6f7', '--accent-hover': '#b388ef', '--accent-light': '#d8b4fe',
      '--accent-subtle': 'rgba(203,166,247,0.10)', '--accent-subtle2': 'rgba(203,166,247,0.18)', '--accent-glow': 'rgba(203,166,247,0.28)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.40)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.50)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.60)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.70)',
    },
  },
  'catppuccin-latte': {
    label: 'Catppuccin Latte', dark: false,
    vars: {
      '--bg': '#eff1f5', '--bg-alt': '#e6e9ef', '--bg-deep': '#dce0e8',
      '--text': '#4c4f69', '--text-2': '#5c5f77', '--text-3': '#6c6f85', '--text-4': '#9ca0b0',
      '--surface-0': 'rgba(239,241,245,0.80)', '--surface-1': 'rgba(230,233,239,0.92)', '--surface-2': 'rgba(220,224,232,0.98)',
      '--border': 'rgba(76,79,105,0.10)', '--border-med': 'rgba(76,79,105,0.16)', '--border-strong': 'rgba(76,79,105,0.24)',
      '--surface-sidebar': 'rgba(220,224,232,0.97)',
      '--accent': '#8839ef', '--accent-hover': '#7527e0', '--accent-light': '#9d4ded',
      '--accent-subtle': 'rgba(136,57,239,0.09)', '--accent-subtle2': 'rgba(136,57,239,0.16)', '--accent-glow': 'rgba(136,57,239,0.25)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.06)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.08)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.10)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.14)',
    },
  },
  'darcula': {
    label: 'Darcula', dark: true,
    vars: {
      '--bg': '#2b2b2b', '--bg-alt': '#313335', '--bg-deep': '#3c3f41',
      '--text': '#a9b7c6', '--text-2': '#9aa6b5', '--text-3': '#859198', '--text-4': '#606366',
      '--surface-0': 'rgba(43,43,43,0.85)', '--surface-1': 'rgba(49,51,53,0.92)', '--surface-2': 'rgba(55,57,59,0.98)',
      '--border': 'rgba(169,183,198,0.12)', '--border-med': 'rgba(169,183,198,0.18)', '--border-strong': 'rgba(169,183,198,0.26)',
      '--surface-sidebar': 'rgba(37,37,37,0.98)',
      '--accent': '#6897bb', '--accent-hover': '#5580a0', '--accent-light': '#89b4d4',
      '--accent-subtle': 'rgba(104,151,187,0.12)', '--accent-subtle2': 'rgba(104,151,187,0.20)', '--accent-glow': 'rgba(104,151,187,0.30)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.40)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.50)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.60)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.70)',
    },
  },
  'monokai': {
    label: 'Monokai', dark: true,
    vars: {
      '--bg': '#272822', '--bg-alt': '#1e1f1c', '--bg-deep': '#16161a',
      '--text': '#f8f8f2', '--text-2': '#e8e8e2', '--text-3': '#c8c8c2', '--text-4': '#75715e',
      '--surface-0': 'rgba(39,40,34,0.85)', '--surface-1': 'rgba(45,46,40,0.92)', '--surface-2': 'rgba(51,52,46,0.98)',
      '--border': 'rgba(248,248,242,0.10)', '--border-med': 'rgba(248,248,242,0.16)', '--border-strong': 'rgba(248,248,242,0.24)',
      '--surface-sidebar': 'rgba(30,31,28,0.98)',
      '--accent': '#a6e22e', '--accent-hover': '#8dc920', '--accent-light': '#c4f05a',
      '--accent-subtle': 'rgba(166,226,46,0.10)', '--accent-subtle2': 'rgba(166,226,46,0.18)', '--accent-glow': 'rgba(166,226,46,0.28)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.40)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.50)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.60)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.70)',
    },
  },
  'nord': {
    label: 'Nord', dark: true,
    vars: {
      '--bg': '#2e3440', '--bg-alt': '#3b4252', '--bg-deep': '#434c5e',
      '--text': '#eceff4', '--text-2': '#e5e9f0', '--text-3': '#d8dee9', '--text-4': '#88c0d0',
      '--surface-0': 'rgba(46,52,64,0.85)', '--surface-1': 'rgba(59,66,82,0.92)', '--surface-2': 'rgba(67,76,94,0.98)',
      '--border': 'rgba(236,239,244,0.10)', '--border-med': 'rgba(236,239,244,0.16)', '--border-strong': 'rgba(236,239,244,0.24)',
      '--surface-sidebar': 'rgba(39,44,55,0.98)',
      '--accent': '#88c0d0', '--accent-hover': '#6aaec0', '--accent-light': '#a3cfdb',
      '--accent-subtle': 'rgba(136,192,208,0.10)', '--accent-subtle2': 'rgba(136,192,208,0.18)', '--accent-glow': 'rgba(136,192,208,0.28)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.40)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.50)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.60)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.70)',
    },
  },
  'solarized-dark': {
    label: 'Solarized Dark', dark: true,
    vars: {
      '--bg': '#002b36', '--bg-alt': '#073642', '--bg-deep': '#0d4451',
      '--text': '#fdf6e3', '--text-2': '#eee8d5', '--text-3': '#93a1a1', '--text-4': '#657b83',
      '--surface-0': 'rgba(0,43,54,0.85)', '--surface-1': 'rgba(7,54,66,0.92)', '--surface-2': 'rgba(13,68,81,0.98)',
      '--border': 'rgba(253,246,227,0.10)', '--border-med': 'rgba(253,246,227,0.16)', '--border-strong': 'rgba(253,246,227,0.24)',
      '--surface-sidebar': 'rgba(0,35,44,0.98)',
      '--accent': '#268bd2', '--accent-hover': '#1a7abf', '--accent-light': '#4fa8e8',
      '--accent-subtle': 'rgba(38,139,210,0.10)', '--accent-subtle2': 'rgba(38,139,210,0.18)', '--accent-glow': 'rgba(38,139,210,0.28)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.40)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.50)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.60)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.70)',
    },
  },
  'solarized-light': {
    label: 'Solarized Light', dark: false,
    vars: {
      '--bg': '#fdf6e3', '--bg-alt': '#eee8d5', '--bg-deep': '#d8d2c0',
      '--text': '#073642', '--text-2': '#135564', '--text-3': '#586e75', '--text-4': '#93a1a1',
      '--surface-0': 'rgba(253,246,227,0.80)', '--surface-1': 'rgba(238,232,213,0.92)', '--surface-2': 'rgba(216,210,192,0.98)',
      '--border': 'rgba(7,54,66,0.10)', '--border-med': 'rgba(7,54,66,0.16)', '--border-strong': 'rgba(7,54,66,0.24)',
      '--surface-sidebar': 'rgba(238,232,213,0.98)',
      '--accent': '#268bd2', '--accent-hover': '#1a7abf', '--accent-light': '#4fa8e8',
      '--accent-subtle': 'rgba(38,139,210,0.09)', '--accent-subtle2': 'rgba(38,139,210,0.16)', '--accent-glow': 'rgba(38,139,210,0.25)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.06)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.08)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.10)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.14)',
    },
  },
  'github-dark': {
    label: 'GitHub Dark', dark: true,
    vars: {
      '--bg': '#0d1117', '--bg-alt': '#161b22', '--bg-deep': '#21262d',
      '--text': '#e6edf3', '--text-2': '#c9d1d9', '--text-3': '#b1bac4', '--text-4': '#8b949e',
      '--surface-0': 'rgba(13,17,23,0.85)', '--surface-1': 'rgba(22,27,34,0.92)', '--surface-2': 'rgba(33,38,45,0.98)',
      '--border': 'rgba(230,237,243,0.10)', '--border-med': 'rgba(230,237,243,0.16)', '--border-strong': 'rgba(230,237,243,0.24)',
      '--surface-sidebar': 'rgba(9,13,18,0.98)',
      '--accent': '#2f81f7', '--accent-hover': '#1f6fe5', '--accent-light': '#58a6ff',
      '--accent-subtle': 'rgba(47,129,247,0.10)', '--accent-subtle2': 'rgba(47,129,247,0.18)', '--accent-glow': 'rgba(47,129,247,0.28)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.40)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.50)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.60)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.70)',
    },
  },
  'tokyo-night': {
    label: 'Tokyo Night', dark: true,
    vars: {
      '--bg': '#1a1b26', '--bg-alt': '#16161e', '--bg-deep': '#13131a',
      '--text': '#a9b1d6', '--text-2': '#9aa5ce', '--text-3': '#787c99', '--text-4': '#565f89',
      '--surface-0': 'rgba(26,27,38,0.85)', '--surface-1': 'rgba(22,22,30,0.92)', '--surface-2': 'rgba(19,19,26,0.98)',
      '--border': 'rgba(169,177,214,0.10)', '--border-med': 'rgba(169,177,214,0.16)', '--border-strong': 'rgba(169,177,214,0.24)',
      '--surface-sidebar': 'rgba(15,15,20,0.98)',
      '--accent': '#7aa2f7', '--accent-hover': '#5d8ef5', '--accent-light': '#9cbaf9',
      '--accent-subtle': 'rgba(122,162,247,0.10)', '--accent-subtle2': 'rgba(122,162,247,0.18)', '--accent-glow': 'rgba(122,162,247,0.28)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.40)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.50)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.60)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.70)',
    },
  },
  'rose-pine': {
    label: 'Rosé Pine', dark: true,
    vars: {
      '--bg': '#191724', '--bg-alt': '#1f1d2e', '--bg-deep': '#26233a',
      '--text': '#e0def4', '--text-2': '#c5c0e0', '--text-3': '#9893b8', '--text-4': '#6e6a86',
      '--surface-0': 'rgba(25,23,36,0.85)', '--surface-1': 'rgba(31,29,46,0.92)', '--surface-2': 'rgba(38,35,58,0.98)',
      '--border': 'rgba(224,222,244,0.10)', '--border-med': 'rgba(224,222,244,0.16)', '--border-strong': 'rgba(224,222,244,0.24)',
      '--surface-sidebar': 'rgba(15,14,22,0.98)',
      '--accent': '#c4a7e7', '--accent-hover': '#ad8ed4', '--accent-light': '#d8c0f0',
      '--accent-subtle': 'rgba(196,167,231,0.10)', '--accent-subtle2': 'rgba(196,167,231,0.18)', '--accent-glow': 'rgba(196,167,231,0.28)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.40)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.50)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.60)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.70)',
    },
  },

  'gruvbox-dark': {
    label: 'Gruvbox Dark', dark: true,
    vars: {
      '--bg': '#282828', '--bg-alt': '#32302f', '--bg-deep': '#1d2021',
      '--text': '#ebdbb2', '--text-2': '#d5c4a1', '--text-3': '#bdae93', '--text-4': '#928374',
      '--surface-0': 'rgba(40,40,40,0.85)', '--surface-1': 'rgba(50,48,47,0.92)', '--surface-2': 'rgba(60,56,54,0.98)',
      '--border': 'rgba(235,219,178,0.10)', '--border-med': 'rgba(235,219,178,0.16)', '--border-strong': 'rgba(235,219,178,0.24)',
      '--surface-sidebar': 'rgba(29,32,33,0.98)',
      '--accent': '#d79921', '--accent-hover': '#b57614', '--accent-light': '#fabd2f',
      '--accent-subtle': 'rgba(215,153,33,0.12)', '--accent-subtle2': 'rgba(215,153,33,0.20)', '--accent-glow': 'rgba(215,153,33,0.32)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.40)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.50)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.60)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.70)',
    },
  },
  'gruvbox-light': {
    label: 'Gruvbox Light', dark: false,
    vars: {
      '--bg': '#fbf1c7', '--bg-alt': '#f2e5bc', '--bg-deep': '#ebdbb2',
      '--text': '#3c3836', '--text-2': '#504945', '--text-3': '#665c54', '--text-4': '#928374',
      '--surface-0': 'rgba(251,241,199,0.80)', '--surface-1': 'rgba(242,229,188,0.92)', '--surface-2': 'rgba(235,219,178,0.98)',
      '--border': 'rgba(60,56,54,0.10)', '--border-med': 'rgba(60,56,54,0.16)', '--border-strong': 'rgba(60,56,54,0.24)',
      '--surface-sidebar': 'rgba(235,219,178,0.98)',
      '--accent': '#d65d0e', '--accent-hover': '#af3a03', '--accent-light': '#fe8019',
      '--accent-subtle': 'rgba(214,93,14,0.09)', '--accent-subtle2': 'rgba(214,93,14,0.16)', '--accent-glow': 'rgba(214,93,14,0.25)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.06)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.08)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.10)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.14)',
    },
  },
  'dracula': {
    label: 'Dracula', dark: true,
    vars: {
      '--bg': '#282a36', '--bg-alt': '#21222c', '--bg-deep': '#191a21',
      '--text': '#f8f8f2', '--text-2': '#e2e2dc', '--text-3': '#c8c8c0', '--text-4': '#6272a4',
      '--surface-0': 'rgba(40,42,54,0.85)', '--surface-1': 'rgba(33,34,44,0.92)', '--surface-2': 'rgba(26,27,38,0.98)',
      '--border': 'rgba(248,248,242,0.10)', '--border-med': 'rgba(248,248,242,0.16)', '--border-strong': 'rgba(248,248,242,0.24)',
      '--surface-sidebar': 'rgba(25,26,33,0.98)',
      '--accent': '#bd93f9', '--accent-hover': '#a472f0', '--accent-light': '#caa8fb',
      '--accent-subtle': 'rgba(189,147,249,0.10)', '--accent-subtle2': 'rgba(189,147,249,0.18)', '--accent-glow': 'rgba(189,147,249,0.30)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.40)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.50)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.60)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.70)',
    },
  },
  'one-dark': {
    label: 'One Dark', dark: true,
    vars: {
      '--bg': '#282c34', '--bg-alt': '#21252b', '--bg-deep': '#181a1f',
      '--text': '#abb2bf', '--text-2': '#9aa0ad', '--text-3': '#818896', '--text-4': '#5c6370',
      '--surface-0': 'rgba(40,44,52,0.85)', '--surface-1': 'rgba(33,37,43,0.92)', '--surface-2': 'rgba(26,29,35,0.98)',
      '--border': 'rgba(171,178,191,0.10)', '--border-med': 'rgba(171,178,191,0.16)', '--border-strong': 'rgba(171,178,191,0.24)',
      '--surface-sidebar': 'rgba(24,26,31,0.98)',
      '--accent': '#61afef', '--accent-hover': '#4d9fdf', '--accent-light': '#84c4f5',
      '--accent-subtle': 'rgba(97,175,239,0.10)', '--accent-subtle2': 'rgba(97,175,239,0.18)', '--accent-glow': 'rgba(97,175,239,0.28)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.40)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.50)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.60)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.70)',
    },
  },
  'night-owl': {
    label: 'Night Owl', dark: true,
    vars: {
      '--bg': '#011627', '--bg-alt': '#01111d', '--bg-deep': '#010e16',
      '--text': '#d6deeb', '--text-2': '#c0c8db', '--text-3': '#a0a8bb', '--text-4': '#637777',
      '--surface-0': 'rgba(1,22,39,0.85)', '--surface-1': 'rgba(1,17,29,0.92)', '--surface-2': 'rgba(1,14,22,0.98)',
      '--border': 'rgba(214,222,235,0.10)', '--border-med': 'rgba(214,222,235,0.16)', '--border-strong': 'rgba(214,222,235,0.24)',
      '--surface-sidebar': 'rgba(1,11,18,0.98)',
      '--accent': '#82aaff', '--accent-hover': '#628de8', '--accent-light': '#a5c0ff',
      '--accent-subtle': 'rgba(130,170,255,0.10)', '--accent-subtle2': 'rgba(130,170,255,0.18)', '--accent-glow': 'rgba(130,170,255,0.28)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.50)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.60)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.70)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.80)',
    },
  },
  'material-ocean': {
    label: 'Material Ocean', dark: true,
    vars: {
      '--bg': '#0f111a', '--bg-alt': '#090b10', '--bg-deep': '#060608',
      '--text': '#8f93a2', '--text-2': '#7e8294', '--text-3': '#6b6f80', '--text-4': '#464b5d',
      '--surface-0': 'rgba(15,17,26,0.85)', '--surface-1': 'rgba(9,11,16,0.92)', '--surface-2': 'rgba(6,6,8,0.98)',
      '--border': 'rgba(143,147,162,0.10)', '--border-med': 'rgba(143,147,162,0.16)', '--border-strong': 'rgba(143,147,162,0.24)',
      '--surface-sidebar': 'rgba(4,4,6,0.98)',
      '--accent': '#82aaff', '--accent-hover': '#5f8fe8', '--accent-light': '#a8beff',
      '--accent-subtle': 'rgba(130,170,255,0.10)', '--accent-subtle2': 'rgba(130,170,255,0.18)', '--accent-glow': 'rgba(130,170,255,0.30)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.60)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.70)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.80)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.85)',
    },
  },
  'ayu-dark': {
    label: 'Ayu Dark', dark: true,
    vars: {
      '--bg': '#0d1017', '--bg-alt': '#0a0e14', '--bg-deep': '#070b10',
      '--text': '#bfbdb6', '--text-2': '#aea9a0', '--text-3': '#8d9099', '--text-4': '#5c6773',
      '--surface-0': 'rgba(13,16,23,0.85)', '--surface-1': 'rgba(10,14,20,0.92)', '--surface-2': 'rgba(7,11,16,0.98)',
      '--border': 'rgba(191,189,182,0.10)', '--border-med': 'rgba(191,189,182,0.16)', '--border-strong': 'rgba(191,189,182,0.24)',
      '--surface-sidebar': 'rgba(5,8,12,0.98)',
      '--accent': '#e6b450', '--accent-hover': '#c99a36', '--accent-light': '#f0c870',
      '--accent-subtle': 'rgba(230,180,80,0.10)', '--accent-subtle2': 'rgba(230,180,80,0.18)', '--accent-glow': 'rgba(230,180,80,0.30)',
      '--sh-xs': '0 1px 3px rgba(0,0,0,0.50)', '--sh-sm': '0 2px 10px rgba(0,0,0,0.60)',
      '--sh-md': '0 4px 22px rgba(0,0,0,0.70)', '--sh-lg': '0 8px 40px rgba(0,0,0,0.80)',
    },
  },
  'paper': {
    label: 'Paper', dark: false,
    vars: {
      '--bg': '#f5f0e8', '--bg-alt': '#ede8e0', '--bg-deep': '#e4ddd4',
      '--text': '#2c2416', '--text-2': '#3d3222', '--text-3': '#5a4c38', '--text-4': '#8c7a64',
      '--surface-0': 'rgba(245,240,232,0.80)', '--surface-1': 'rgba(237,232,224,0.92)', '--surface-2': 'rgba(228,221,212,0.98)',
      '--border': 'rgba(44,36,22,0.10)', '--border-med': 'rgba(44,36,22,0.16)', '--border-strong': 'rgba(44,36,22,0.24)',
      '--surface-sidebar': 'rgba(228,221,212,0.98)',
      '--accent': '#8b3a00', '--accent-hover': '#6e2e00', '--accent-light': '#b85000',
      '--accent-subtle': 'rgba(139,58,0,0.09)', '--accent-subtle2': 'rgba(139,58,0,0.16)', '--accent-glow': 'rgba(139,58,0,0.25)',
      '--sh-xs': '0 1px 3px rgba(44,36,22,0.08)', '--sh-sm': '0 2px 10px rgba(44,36,22,0.10)',
      '--sh-md': '0 4px 22px rgba(44,36,22,0.12)', '--sh-lg': '0 8px 40px rgba(44,36,22,0.16)',
    },
  },
};

/* ─────────────────────────────────────────────────────────── */
/*  Fonts & colours                                             */
/* ─────────────────────────────────────────────────────────── */
export const EDITOR_FONTS = [
  { id: 'google-sans',   label: 'Google Sans',    stack: "'Google Sans Flex','Google Sans','DM Sans',sans-serif", mono: false },
  { id: 'georgia',       label: 'Georgia',         stack: "Georgia,'Times New Roman',serif", mono: false },
  { id: 'palatino',      label: 'Palatino',        stack: "'Palatino Linotype',Palatino,'Book Antiqua',serif", mono: false },
  { id: 'garamond',      label: 'EB Garamond',     stack: "'EB Garamond',Garamond,serif", mono: false },
  { id: 'merriweather',  label: 'Merriweather',    stack: "Merriweather,Georgia,serif", mono: false },
  { id: 'lora',          label: 'Lora',            stack: "Lora,Georgia,serif", mono: false },
  { id: 'jetbrains',     label: 'JetBrains Mono',  stack: "'JetBrains Mono','Fira Code',monospace", mono: true },
  { id: 'fira-code',     label: 'Fira Code',       stack: "'Fira Code','Cascadia Code',monospace", mono: true },
  { id: 'ibm-plex-mono', label: 'IBM Plex Mono',   stack: "'IBM Plex Mono','Courier New',monospace", mono: true },
  { id: 'source-code',   label: 'Source Code Pro', stack: "'Source Code Pro',monospace", mono: true },
];

export const UI_FONTS = [
  { id: 'google-sans',  label: 'Google Sans',  stack: "'Google Sans Flex','Google Sans','DM Sans',sans-serif" },
  { id: 'system',       label: 'System UI',    stack: "system-ui,-apple-system,sans-serif" },
  { id: 'inter',        label: 'Inter',        stack: "'Inter',sans-serif" },
  { id: 'dm-sans',      label: 'DM Sans',      stack: "'DM Sans',sans-serif" },
  { id: 'plus-jakarta', label: 'Plus Jakarta', stack: "'Plus Jakarta Sans',sans-serif" },
];

export const ACCENT_COLORS = [
  { id: 'purple', label: 'Violet',  value: '#9875c1' },
  { id: 'blue',   label: 'Blue',    value: '#2f81f7' },
  { id: 'teal',   label: 'Teal',    value: '#14b8a6' },
  { id: 'green',  label: 'Green',   value: '#22c55e' },
  { id: 'amber',  label: 'Amber',   value: '#f59e0b' },
  { id: 'rose',   label: 'Rose',    value: '#f43f5e' },
  { id: 'orange', label: 'Orange',  value: '#f97316' },
  { id: 'indigo', label: 'Indigo',  value: '#6366f1' },
];

/* ─────────────────────────────────────────────────────────── */
/*  applySettings                                               */
/* ─────────────────────────────────────────────────────────── */
const ALL_THEME_VARS = [
  '--bg','--bg-alt','--bg-deep',
  '--surface-0','--surface-1','--surface-2','--surface-sidebar',
  '--border','--border-med','--border-strong',
  '--text','--text-2','--text-3','--text-4','--text-5',
  '--sh-xs','--sh-sm','--sh-md','--sh-lg',
  '--accent','--accent-hover','--accent-light','--accent-subtle','--accent-subtle2','--accent-glow',
];

export function applySettings(s: AppSettings): boolean {
  if (typeof document === 'undefined') return false;
  const theme = THEMES[s.theme] ?? THEMES['default-dark'];
  const isDark = theme.dark;
  const root = document.documentElement;

  // Brief .theme-transitioning class enables smooth cross-fade of colours
  root.classList.add('theme-transitioning');
  requestAnimationFrame(() => setTimeout(() => root.classList.remove('theme-transitioning'), 260));

  // Toggle .dark on <html> for CSS child selectors like `.dark .foo`
  isDark ? root.classList.add('dark') : root.classList.remove('dark');

  // Wipe all previously-set inline theme vars so nothing bleeds between switches
  ALL_THEME_VARS.forEach(v => root.style.removeProperty(v));

  // Apply this theme's vars as inline styles — inline always beats class-level vars
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));

  // For themes without their own accent, use the user's chosen colour
  if (!theme.vars['--accent']) {
    const h = s.accentColor;
    root.style.setProperty('--accent', h);
    root.style.setProperty('--accent-hover',   h + 'cc');
    root.style.setProperty('--accent-light',   h + 'aa');
    root.style.setProperty('--accent-subtle',  h + '18');
    root.style.setProperty('--accent-subtle2', h + '28');
    root.style.setProperty('--accent-glow',    h + '40');
  }

  // Sync design-system token aliases with the freshly-applied theme vars.
  // We read from root.style (the inline declarations we just set) so the
  // alias receives the concrete value — not a var() chain that could break
  // if the CSS cascade order ever changes.
  root.style.setProperty('--ink',        root.style.getPropertyValue('--text'));
  root.style.setProperty('--paper',      root.style.getPropertyValue('--bg'));
  root.style.setProperty('--cream',      root.style.getPropertyValue('--bg-alt'));
  root.style.setProperty('--mid',        root.style.getPropertyValue('--text-4'));
  root.style.setProperty('--rule',       root.style.getPropertyValue('--border'));
  root.style.setProperty('--tape-bg',    root.style.getPropertyValue('--bg-deep'));
  root.style.setProperty('--accent-dim', root.style.getPropertyValue('--accent-subtle'));
  root.style.setProperty('--accent-sub', root.style.getPropertyValue('--accent-subtle2'));

  // Editor display vars
  const edFont = EDITOR_FONTS.find(f => f.id === s.editorFont)?.stack ?? EDITOR_FONTS[0].stack;
  root.style.setProperty('--editor-font',        edFont);
  root.style.setProperty('--editor-font-size',   `${s.editorFontSize}px`);
  root.style.setProperty('--editor-line-height', String(s.lineHeight));
  root.style.setProperty('--editor-max-width',   `${s.maxWidth}px`);

  // UI font
  const uiFont = UI_FONTS.find(f => f.id === s.uiFont)?.stack ?? UI_FONTS[0].stack;
  root.style.setProperty('--ui-font', uiFont);

  // Accessibility flags
  root.classList.toggle('reduced-motion', s.reducedMotion);
  root.classList.toggle('high-contrast',  s.highContrast);

  return isDark;
}

/* ─────────────────────────────────────────────────────────── */
/*  Persistence                                                 */
/* ─────────────────────────────────────────────────────────── */

/**
 * localStorage key for settings cache.
 * Supabase user metadata is the source of truth; localStorage is a fast-read
 * cache that is written whenever settings are saved (so pages read the correct
 * theme immediately on mount, before the auth round-trip completes).
 */
const SETTINGS_KEY = 'cs-settings';

export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(s: AppSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {}
}

/* ─────────────────────────────────────────────────────────── */
/*  Small shared UI atoms                                       */
/* ─────────────────────────────────────────────────────────── */
function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ paddingRight: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 3 }}>{hint}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      style={{
        position: 'relative', width: 40, height: 22, borderRadius: 11,
        border: 'none', padding: 0, cursor: 'pointer', outline: 'none',
        background: value ? 'var(--accent)' : 'var(--border-strong)',
        transition: 'background 0.18s',
      }}
    >
      <span style={{
        display: 'block', position: 'absolute', top: 2,
        left: value ? 20 : 2, width: 18, height: 18,
        borderRadius: '50%', background: '#fff',
        transition: 'left 0.18s', boxShadow: '0 1px 4px rgba(0,0,0,0.28)',
      }} />
    </button>
  );
}

function Slider({ value, min, max, step, onChange, suffix }: {
  value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; suffix?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: 110, accentColor: 'var(--accent)', cursor: 'pointer' }}
      />
      <span style={{ fontSize: 11, color: 'var(--text-4)', minWidth: 40, textAlign: 'right' }}>
        {value}{suffix}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  ThemeCard — colours come from the theme object, never      */
/*  from CSS vars, so it renders correctly regardless of the   */
/*  currently active app theme.                                 */
/* ─────────────────────────────────────────────────────────── */
function ThemeCard({ id, selected, onClick }: { id: string; selected: boolean; onClick: () => void }) {
  const t = THEMES[id];
  if (!t) return null;
  const bg   = t.vars['--bg']     ?? '#111';
  const bgA  = t.vars['--bg-alt'] ?? '#222';
  const acc  = t.vars['--accent'] ?? '#9875c1';
  const txt  = t.vars['--text']   ?? '#eee';
  const txt4 = t.vars['--text-4'] ?? '#888';
  const bdr  = t.vars['--border'] ?? 'rgba(255,255,255,0.12)';

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'block', width: '100%', padding: 0, cursor: 'pointer', outline: 'none',
        borderRadius: 10, overflow: 'hidden',
        border: selected ? `2px solid ${acc}` : `2px solid ${bdr}`,
        boxShadow: selected ? `0 0 0 3px ${acc}44` : 'none',
        background: bg, transition: 'border-color 0.12s, box-shadow 0.12s',
      }}
    >
      {/* mini editor chrome */}
      <div style={{ padding: '8px 10px', background: bgA, borderBottom: `1px solid ${bdr}` }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 7 }}>
          {['#ff6058','#ffbd2e','#28ca42'].map(c => (
            <div key={c} style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ height: 4, width: '65%', borderRadius: 2, background: acc,  opacity: 0.9 }} />
          <div style={{ height: 3, width: '88%', borderRadius: 2, background: txt,  opacity: 0.35 }} />
          <div style={{ height: 3, width: '52%', borderRadius: 2, background: txt4, opacity: 0.55 }} />
          <div style={{ height: 3, width: '76%', borderRadius: 2, background: txt,  opacity: 0.22 }} />
        </div>
      </div>
      <div style={{ padding: '5px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: txt4, fontWeight: 500 }}>{t.label}</span>
        {selected && <Check size={10} color={acc} strokeWidth={3} />}
      </div>
    </button>
  );
}

function ShortcutRow({ label, keys }: { label: string; keys: string[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{label}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {keys.map((k, i) => (
          <kbd key={i} style={{
            padding: '2px 7px', borderRadius: 5, background: 'var(--bg-deep)',
            border: '1px solid var(--border-med)', fontSize: 10, color: 'var(--text-3)',
            fontFamily: 'monospace', boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          }}>{k}</kbd>
        ))}
      </div>
    </div>
  );
}

const NAV_SECTIONS = [
  { id: 'appearance', label: 'Appearance', Icon: Palette },
  { id: 'editor',     label: 'Editor',     Icon: Type },
  { id: 'display',    label: 'Display',    Icon: Monitor },
  { id: 'behaviour',  label: 'Behaviour',  Icon: Eye },
  { id: 'advanced',   label: 'Advanced',   Icon: Sliders },
  { id: 'shortcuts',  label: 'Shortcuts',  Icon: Keyboard },
];

/* ─────────────────────────────────────────────────────────── */
/*  SettingsModal                                               */
/* ─────────────────────────────────────────────────────────── */
export default function SettingsModal({ settings, onClose, onChange }: {
  settings: AppSettings;
  onClose: () => void;
  onChange: (next: AppSettings) => void;
}) {
  const [section, setSection] = useState('appearance');
  const [local, setLocal] = useState<AppSettings>(() => ({ ...settings }));

  // Always read the latest local state from a ref inside event handlers
  // so we never close over a stale value
  const localRef = useRef<AppSettings>(local);
  useEffect(() => { localRef.current = local; }, [local]);

  // Close on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  // KEY FIX: `update` is a plain function — NOT a useCallback with stale deps,
  // and NOT calling onChange inside a setState updater (which causes React errors).
  // It reads the latest state from localRef, updates local state, then notifies parent.
  function update<K extends keyof AppSettings>(key: K, val: AppSettings[K]) {
    const next = { ...localRef.current, [key]: val };
    localRef.current = next;    // keep ref in sync immediately
    setLocal(next);             // schedule re-render with new local state
    onChange(next);             // notify parent so applySettings / save run
  }

  function reset() {
    const next = { ...DEFAULT_SETTINGS };
    localRef.current = next;
    setLocal(next);
    onChange(next);
  }

  const themeGroups = [
    { label: 'Dark',  ids: ['default-dark','catppuccin-mocha','darcula','dracula','monokai','one-dark','night-owl','material-ocean','nord','github-dark','tokyo-night','rose-pine','gruvbox-dark','ayu-dark','solarized-dark'] },
    { label: 'Light', ids: ['default-light','catppuccin-latte','gruvbox-light','paper','solarized-light'] },
  ];

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal box — stop propagation so backdrop click handler doesn't fire on inner clicks */}
      <div
        onMouseDown={e => e.stopPropagation()}
        style={{
          width: 800, maxWidth: '96vw', height: 590, maxHeight: '92vh',
          borderRadius: 'var(--r-xl)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
          background: 'var(--surface-2)', border: '1px solid var(--border-med)', boxShadow: 'var(--sh-lg)',
          animation: 'sm-fadein 0.16s ease',
        }}
      >
        {/* ── Header bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-med)', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Settings</div>
            <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 3 }}>Customise your Vantage experience</div>
          </div>
          <button type="button" onClick={onClose} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--r-sm)', border: 'none', background: 'transparent', color: 'var(--text-4)', cursor: 'pointer', outline: 'none' }}>
            <X size={15} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="settings-modal-inner" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Nav sidebar */}
          <nav className="settings-nav" style={{ width: 156, flexShrink: 0, borderRight: '1px solid var(--border)', padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--surface-sidebar)', overflowY: 'auto' }}>
            {NAV_SECTIONS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', width: '100%',
                  borderRadius: 'var(--r-md)', border: 'none', cursor: 'pointer', textAlign: 'left', outline: 'none',
                  background: section === id ? 'var(--accent-subtle2)' : 'transparent',
                  color: section === id ? 'var(--accent)' : 'var(--text-4)',
                  fontSize: 12, fontWeight: section === id ? 600 : 500, transition: 'all 0.1s',
                }}
              >
                <Icon size={13} strokeWidth={2} />
                {label}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <p style={{ fontSize: 10, color: 'var(--text-4)', padding: '8px 10px', margin: 0, opacity: 0.7 }}>
              Changes apply instantly
            </p>
          </nav>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px' }}>

            {/* APPEARANCE */}
            {section === 'appearance' && <>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-4)', textTransform: 'uppercase', margin: '0 0 10px' }}>Theme</p>
              {themeGroups.map(g => (
                <div key={g.label} style={{ marginBottom: 18 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-4)', margin: '0 0 8px' }}>{g.label}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(100px,1fr))', gap: 8 }}>
                    {g.ids.map(id => (
                      <ThemeCard key={id} id={id} selected={local.theme === id} onClick={() => update('theme', id)} />
                    ))}
                  </div>
                </div>
              ))}

              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-4)', textTransform: 'uppercase', margin: '20px 0 10px' }}>Accent Colour</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {ACCENT_COLORS.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    title={c.label}
                    onClick={() => update('accentColor', c.value)}
                    style={{
                      width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer',
                      background: c.value, outline: local.accentColor === c.value ? `3px solid var(--text)` : '3px solid transparent',
                      outlineOffset: 2, transform: local.accentColor === c.value ? 'scale(1.18)' : 'scale(1)',
                      transition: 'transform 0.12s, outline-color 0.12s', boxShadow: `0 0 0 1px ${c.value}55`,
                    }}
                  />
                ))}
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-4)' }}>Custom</span>
                  <input type="color" value={local.accentColor} onChange={e => update('accentColor', e.target.value)}
                    style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0 }} />
                </label>
              </div>

              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-4)', textTransform: 'uppercase', margin: '20px 0 10px' }}>UI Font</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {UI_FONTS.map(f => (
                  <button key={f.id} type="button" onClick={() => update('uiFont', f.id)}
                    style={{
                      padding: '5px 13px', borderRadius: 20, border: '1px solid', cursor: 'pointer', outline: 'none',
                      borderColor: local.uiFont === f.id ? 'var(--accent)' : 'var(--border-med)',
                      background: local.uiFont === f.id ? 'var(--accent-subtle2)' : 'var(--bg-alt)',
                      color: local.uiFont === f.id ? 'var(--accent)' : 'var(--text-3)',
                      fontSize: 12, fontFamily: f.stack, transition: 'all 0.1s',
                    }}
                  >{f.label}</button>
                ))}
              </div>
            </>}

            {/* EDITOR */}
            {section === 'editor' && <>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-4)', textTransform: 'uppercase', margin: '0 0 10px' }}>Editor Font</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(175px,1fr))', gap: 6, marginBottom: 20 }}>
                {EDITOR_FONTS.map(f => (
                  <button key={f.id} type="button" onClick={() => update('editorFont', f.id)}
                    style={{
                      padding: '9px 12px', borderRadius: 8, border: '1px solid', textAlign: 'left',
                      cursor: 'pointer', outline: 'none', transition: 'all 0.1s',
                      borderColor: local.editorFont === f.id ? 'var(--accent)' : 'var(--border)',
                      background: local.editorFont === f.id ? 'var(--accent-subtle)' : 'var(--bg-alt)',
                      color: local.editorFont === f.id ? 'var(--accent)' : 'var(--text-3)',
                    }}
                  >
                    <div style={{ fontFamily: f.stack, fontSize: 14 }}>Aa Bb Cc</div>
                    <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 4 }}>
                      {f.label}{f.mono ? ' · Mono' : ''}
                    </div>
                  </button>
                ))}
              </div>
              <Row label="Font size" hint="Editor text size">
                <Slider value={local.editorFontSize} min={11} max={24} step={1} onChange={v => update('editorFontSize', v)} suffix="px" />
              </Row>
              <Row label="Line height" hint="Vertical spacing between lines">
                <Slider value={local.lineHeight} min={1.2} max={2.4} step={0.05} onChange={v => update('lineHeight', parseFloat(v.toFixed(2)))} />
              </Row>
            </>}

            {/* DISPLAY */}
            {section === 'display' && <>
              <Row label="Line numbers" hint="Show line numbers in the gutter">
                <Toggle value={local.lineNumbers} onChange={v => update('lineNumbers', v)} />
              </Row>
              <Row label="Highlight active line" hint="Subtly highlight the line the cursor is on">
                <Toggle value={local.highlightActiveLine} onChange={v => update('highlightActiveLine', v)} />
              </Row>
              <Row label="Word wrap" hint="Wrap long lines within the editor width">
                <Toggle value={local.wordWrap} onChange={v => update('wordWrap', v)} />
              </Row>
              <Row label="Show minimap" hint="Show a miniature document overview on the right">
                <Toggle value={local.showMinimap} onChange={v => update('showMinimap', v)} />
              </Row>
              <Row label="Max content width" hint="Maximum width of the writing area">
                <Slider value={local.maxWidth} min={480} max={1100} step={20} onChange={v => update('maxWidth', v)} suffix="px" />
              </Row>
              <Row label="Focus mode fade" hint="Opacity of non-active lines in focus mode">
                <Slider value={local.focusFade} min={5} max={80} step={5} onChange={v => update('focusFade', v)} suffix="%" />
              </Row>
              <Row label="Zen mode toolbar" hint="Keep the toolbar visible in zen mode">
                <Toggle value={local.zenToolbar} onChange={v => update('zenToolbar', v)} />
              </Row>
            </>}

            {/* BEHAVIOUR */}
            {section === 'behaviour' && <>
              <Row label="Auto-save" hint="Automatically save documents as you type">
                <Toggle value={local.autoSave} onChange={v => update('autoSave', v)} />
              </Row>
              <Row label="Spell check" hint="Underline misspelled words in the editor">
                <Toggle value={local.spellcheck} onChange={v => update('spellcheck', v)} />
              </Row>
              <Row label="Tab size" hint="Spaces inserted per Tab keypress">
                <div style={{ display: 'flex', gap: 6 }}>
                  {[2,4,8].map(n => (
                    <button key={n} type="button" onClick={() => update('tabSize', n)}
                      style={{
                        padding: '4px 12px', borderRadius: 'var(--r-sm)', border: '1px solid',
                        cursor: 'pointer', outline: 'none', fontSize: 12, transition: 'all 0.1s',
                        borderColor: local.tabSize === n ? 'var(--accent)' : 'var(--border-med)',
                        background: local.tabSize === n ? 'var(--accent-subtle2)' : 'var(--bg-alt)',
                        color: local.tabSize === n ? 'var(--accent)' : 'var(--text-3)',
                      }}
                    >{n}</button>
                  ))}
                </div>
              </Row>
              <Row label="Push notifications" hint="Enable push notifications for updates (required on mobile)">
                <button type="button" onClick={() => requestPushSubscription().catch(console.error)}
                  style={{ padding: '6px 14px', borderRadius: 'var(--r-sm)', border: '1px solid var(--accent)', background: 'var(--accent)', color: 'var(--paper)', fontSize: 11, fontWeight: 600, cursor: 'pointer', outline: 'none', letterSpacing: '0.04em' }}
                >Enable</button>
              </Row>
            </>}

            {/* ADVANCED */}
            {section === 'advanced' && <>
              <Row label="Reduced motion" hint="Disable animations and transitions">
                <Toggle value={local.reducedMotion} onChange={v => update('reducedMotion', v)} />
              </Row>
              <Row label="High contrast" hint="Increase border and text contrast">
                <Toggle value={local.highContrast} onChange={v => update('highContrast', v)} />
              </Row>
              <div style={{ marginTop: 24, padding: 16, borderRadius: 'var(--r-md)', background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 6 }}>Reset to defaults</div>
                <div style={{ fontSize: 11, color: 'var(--text-4)', marginBottom: 14, lineHeight: 1.5 }}>
                  Resets all settings. Your documents are not affected.
                </div>
                <button type="button" onClick={reset}
                  style={{ padding: '6px 14px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-med)', background: 'var(--bg-deep)', color: 'var(--text-3)', fontSize: 12, cursor: 'pointer', outline: 'none' }}
                >Reset settings</button>
              </div>
            </>}

            {/* SHORTCUTS */}
            {section === 'shortcuts' && <>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-4)', textTransform: 'uppercase', margin: '0 0 12px' }}>Keyboard Shortcuts</p>
              <ShortcutRow label="Command palette"  keys={['⌘','K']} />
              <ShortcutRow label="Toggle dark mode" keys={['⌘','Shift','D']} />
              <ShortcutRow label="Focus mode"       keys={['⌘','Shift','F']} />
              <ShortcutRow label="Zen mode"         keys={['⌘','Shift','Z']} />
              <ShortcutRow label="Bold"             keys={['⌘','B']} />
              <ShortcutRow label="Italic"           keys={['⌘','I']} />
              <ShortcutRow label="Underline"        keys={['⌘','U']} />
              <ShortcutRow label="Save"             keys={['⌘','S']} />
              <ShortcutRow label="Find"             keys={['⌘','F']} />
              <ShortcutRow label="New tab"          keys={['⌘','T']} />
              <ShortcutRow label="Close tab"        keys={['⌘','W']} />
              <ShortcutRow label="Navigate tabs"    keys={['⌘','1–9']} />
              <ShortcutRow label="Export markdown"  keys={['⌘','Shift','E']} />
            </>}

          </div>
        </div>
      </div>

      <style>{`
        @keyframes sm-fadein {
          from { opacity:0; transform:translateY(10px) scale(0.97); }
          to   { opacity:1; transform:translateY(0)    scale(1); }
        }
      `}</style>
    </div>
  );
}
