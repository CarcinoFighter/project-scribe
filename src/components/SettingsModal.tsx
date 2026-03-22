'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Palette, Type, Monitor, Eye, Sliders, Keyboard, Check
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────── */
export interface AppSettings {
  // Appearance
  theme: string;
  accentColor: string;
  // Editor
  editorFont: string;
  editorFontSize: number;
  lineHeight: number;
  uiFont: string;
  // Editor behaviour
  wordWrap: boolean;
  lineNumbers: boolean;
  highlightActiveLine: boolean;
  showMinimap: boolean;
  // Editing
  tabSize: number;
  spellcheck: boolean;
  autoSave: boolean;
  // Display
  maxWidth: number;
  focusFade: number;
  zenToolbar: boolean;
  // Accessibility
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

/* ─── Theme definitions ───────────────────────────────────── */
export const THEMES: Record<string, { label: string; dark: boolean; vars: Record<string, string> }> = {
  'default-light': {
    label: 'Scribe Light', dark: false,
    vars: {
      '--bg': '#ffffff', '--bg-alt': '#f7f7f7', '--bg-deep': '#f0f0f0',
      '--text': '#0a0a0a', '--text-2': '#2a2a2a', '--text-3': '#3a3a3a', '--text-4': '#636363',
      '--surface-0': 'rgba(255,255,255,0.72)', '--surface-1': 'rgba(255,255,255,0.88)', '--surface-2': 'rgba(255,255,255,0.97)',
      '--border': 'rgba(0,0,0,0.09)', '--border-med': 'rgba(0,0,0,0.14)', '--border-strong': 'rgba(0,0,0,0.22)',
      '--surface-sidebar': 'rgba(238,238,238,0.94)',
    },
  },
  'default-dark': {
    label: 'Scribe Dark', dark: true,
    vars: {
      '--bg': '#0a0a0a', '--bg-alt': '#111111', '--bg-deep': '#181818',
      '--text': '#f0f0f0', '--text-2': '#d0d0d0', '--text-3': '#b8b8b8', '--text-4': '#787878',
      '--surface-0': 'rgba(16,16,16,0.75)', '--surface-1': 'rgba(22,22,22,0.88)', '--surface-2': 'rgba(28,28,28,0.97)',
      '--border': 'rgba(255,255,255,0.10)', '--border-med': 'rgba(255,255,255,0.16)', '--border-strong': 'rgba(255,255,255,0.26)',
      '--surface-sidebar': 'rgba(20,20,20,0.96)',
    },
  },
  'catppuccin-mocha': {
    label: 'Catppuccin Mocha', dark: true,
    vars: {
      '--bg': '#1e1e2e', '--bg-alt': '#181825', '--bg-deep': '#11111b',
      '--text': '#cdd6f4', '--text-2': '#bac2de', '--text-3': '#a6adc8', '--text-4': '#7f849c',
      '--surface-0': 'rgba(30,30,46,0.8)', '--surface-1': 'rgba(36,36,54,0.92)', '--surface-2': 'rgba(42,42,62,0.98)',
      '--border': 'rgba(205,214,244,0.08)', '--border-med': 'rgba(205,214,244,0.14)', '--border-strong': 'rgba(205,214,244,0.22)',
      '--surface-sidebar': 'rgba(17,17,27,0.95)',
      '--accent': '#cba6f7', '--accent-hover': '#b388ef', '--accent-light': '#d8b4fe', '--accent-subtle': 'rgba(203,166,247,0.10)', '--accent-subtle2': 'rgba(203,166,247,0.18)', '--accent-glow': 'rgba(203,166,247,0.28)',
    },
  },
  'catppuccin-latte': {
    label: 'Catppuccin Latte', dark: false,
    vars: {
      '--bg': '#eff1f5', '--bg-alt': '#e6e9ef', '--bg-deep': '#dce0e8',
      '--text': '#4c4f69', '--text-2': '#5c5f77', '--text-3': '#6c6f85', '--text-4': '#9ca0b0',
      '--surface-0': 'rgba(239,241,245,0.8)', '--surface-1': 'rgba(230,233,239,0.92)', '--surface-2': 'rgba(220,224,232,0.98)',
      '--border': 'rgba(76,79,105,0.10)', '--border-med': 'rgba(76,79,105,0.16)', '--border-strong': 'rgba(76,79,105,0.24)',
      '--surface-sidebar': 'rgba(220,224,232,0.95)',
      '--accent': '#8839ef', '--accent-hover': '#7527e0', '--accent-light': '#9d4ded', '--accent-subtle': 'rgba(136,57,239,0.09)', '--accent-subtle2': 'rgba(136,57,239,0.16)', '--accent-glow': 'rgba(136,57,239,0.25)',
    },
  },
  'darcula': {
    label: 'Darcula', dark: true,
    vars: {
      '--bg': '#2b2b2b', '--bg-alt': '#313335', '--bg-deep': '#3c3f41',
      '--text': '#a9b7c6', '--text-2': '#9aa6b5', '--text-3': '#859198', '--text-4': '#606366',
      '--surface-0': 'rgba(43,43,43,0.82)', '--surface-1': 'rgba(49,51,53,0.92)', '--surface-2': 'rgba(55,57,59,0.98)',
      '--border': 'rgba(169,183,198,0.10)', '--border-med': 'rgba(169,183,198,0.16)', '--border-strong': 'rgba(169,183,198,0.24)',
      '--surface-sidebar': 'rgba(37,37,37,0.97)',
      '--accent': '#6897bb', '--accent-hover': '#5580a0', '--accent-light': '#89b4d4', '--accent-subtle': 'rgba(104,151,187,0.12)', '--accent-subtle2': 'rgba(104,151,187,0.20)', '--accent-glow': 'rgba(104,151,187,0.30)',
    },
  },
  'monokai': {
    label: 'Monokai', dark: true,
    vars: {
      '--bg': '#272822', '--bg-alt': '#1e1f1c', '--bg-deep': '#16161a',
      '--text': '#f8f8f2', '--text-2': '#e8e8e2', '--text-3': '#c8c8c2', '--text-4': '#75715e',
      '--surface-0': 'rgba(39,40,34,0.82)', '--surface-1': 'rgba(45,46,40,0.92)', '--surface-2': 'rgba(51,52,46,0.98)',
      '--border': 'rgba(248,248,242,0.10)', '--border-med': 'rgba(248,248,242,0.16)', '--border-strong': 'rgba(248,248,242,0.24)',
      '--surface-sidebar': 'rgba(30,31,28,0.97)',
      '--accent': '#a6e22e', '--accent-hover': '#8dc920', '--accent-light': '#c4f05a', '--accent-subtle': 'rgba(166,226,46,0.10)', '--accent-subtle2': 'rgba(166,226,46,0.18)', '--accent-glow': 'rgba(166,226,46,0.28)',
    },
  },
  'nord': {
    label: 'Nord', dark: true,
    vars: {
      '--bg': '#2e3440', '--bg-alt': '#3b4252', '--bg-deep': '#434c5e',
      '--text': '#eceff4', '--text-2': '#e5e9f0', '--text-3': '#d8dee9', '--text-4': '#88c0d0',
      '--surface-0': 'rgba(46,52,64,0.82)', '--surface-1': 'rgba(59,66,82,0.92)', '--surface-2': 'rgba(67,76,94,0.98)',
      '--border': 'rgba(236,239,244,0.10)', '--border-med': 'rgba(236,239,244,0.16)', '--border-strong': 'rgba(236,239,244,0.24)',
      '--surface-sidebar': 'rgba(39,44,55,0.97)',
      '--accent': '#88c0d0', '--accent-hover': '#6aaec0', '--accent-light': '#a3cfdb', '--accent-subtle': 'rgba(136,192,208,0.10)', '--accent-subtle2': 'rgba(136,192,208,0.18)', '--accent-glow': 'rgba(136,192,208,0.28)',
    },
  },
  'solarized-dark': {
    label: 'Solarized Dark', dark: true,
    vars: {
      '--bg': '#002b36', '--bg-alt': '#073642', '--bg-deep': '#0d4451',
      '--text': '#fdf6e3', '--text-2': '#eee8d5', '--text-3': '#93a1a1', '--text-4': '#657b83',
      '--surface-0': 'rgba(0,43,54,0.82)', '--surface-1': 'rgba(7,54,66,0.92)', '--surface-2': 'rgba(13,68,81,0.98)',
      '--border': 'rgba(253,246,227,0.10)', '--border-med': 'rgba(253,246,227,0.16)', '--border-strong': 'rgba(253,246,227,0.24)',
      '--surface-sidebar': 'rgba(0,35,44,0.97)',
      '--accent': '#268bd2', '--accent-hover': '#1a7abf', '--accent-light': '#4fa8e8', '--accent-subtle': 'rgba(38,139,210,0.10)', '--accent-subtle2': 'rgba(38,139,210,0.18)', '--accent-glow': 'rgba(38,139,210,0.28)',
    },
  },
  'solarized-light': {
    label: 'Solarized Light', dark: false,
    vars: {
      '--bg': '#fdf6e3', '--bg-alt': '#eee8d5', '--bg-deep': '#d8d2c0',
      '--text': '#073642', '--text-2': '#135564', '--text-3': '#586e75', '--text-4': '#93a1a1',
      '--surface-0': 'rgba(253,246,227,0.80)', '--surface-1': 'rgba(238,232,213,0.92)', '--surface-2': 'rgba(216,210,192,0.98)',
      '--border': 'rgba(7,54,66,0.10)', '--border-med': 'rgba(7,54,66,0.16)', '--border-strong': 'rgba(7,54,66,0.24)',
      '--surface-sidebar': 'rgba(238,232,213,0.97)',
      '--accent': '#268bd2', '--accent-hover': '#1a7abf', '--accent-light': '#4fa8e8', '--accent-subtle': 'rgba(38,139,210,0.09)', '--accent-subtle2': 'rgba(38,139,210,0.16)', '--accent-glow': 'rgba(38,139,210,0.25)',
    },
  },
  'github-dark': {
    label: 'GitHub Dark', dark: true,
    vars: {
      '--bg': '#0d1117', '--bg-alt': '#161b22', '--bg-deep': '#21262d',
      '--text': '#e6edf3', '--text-2': '#c9d1d9', '--text-3': '#b1bac4', '--text-4': '#8b949e',
      '--surface-0': 'rgba(13,17,23,0.82)', '--surface-1': 'rgba(22,27,34,0.92)', '--surface-2': 'rgba(33,38,45,0.98)',
      '--border': 'rgba(230,237,243,0.08)', '--border-med': 'rgba(230,237,243,0.14)', '--border-strong': 'rgba(230,237,243,0.22)',
      '--surface-sidebar': 'rgba(9,13,18,0.97)',
      '--accent': '#2f81f7', '--accent-hover': '#1f6fe5', '--accent-light': '#58a6ff', '--accent-subtle': 'rgba(47,129,247,0.10)', '--accent-subtle2': 'rgba(47,129,247,0.18)', '--accent-glow': 'rgba(47,129,247,0.28)',
    },
  },
  'tokyo-night': {
    label: 'Tokyo Night', dark: true,
    vars: {
      '--bg': '#1a1b26', '--bg-alt': '#16161e', '--bg-deep': '#13131a',
      '--text': '#a9b1d6', '--text-2': '#9aa5ce', '--text-3': '#787c99', '--text-4': '#565f89',
      '--surface-0': 'rgba(26,27,38,0.82)', '--surface-1': 'rgba(22,22,30,0.92)', '--surface-2': 'rgba(19,19,26,0.98)',
      '--border': 'rgba(169,177,214,0.08)', '--border-med': 'rgba(169,177,214,0.14)', '--border-strong': 'rgba(169,177,214,0.22)',
      '--surface-sidebar': 'rgba(15,15,20,0.97)',
      '--accent': '#7aa2f7', '--accent-hover': '#5d8ef5', '--accent-light': '#9cbaf9', '--accent-subtle': 'rgba(122,162,247,0.10)', '--accent-subtle2': 'rgba(122,162,247,0.18)', '--accent-glow': 'rgba(122,162,247,0.28)',
    },
  },
  'rose-pine': {
    label: "Rosé Pine", dark: true,
    vars: {
      '--bg': '#191724', '--bg-alt': '#1f1d2e', '--bg-deep': '#26233a',
      '--text': '#e0def4', '--text-2': '#c5c0e0', '--text-3': '#9893b8', '--text-4': '#6e6a86',
      '--surface-0': 'rgba(25,23,36,0.82)', '--surface-1': 'rgba(31,29,46,0.92)', '--surface-2': 'rgba(38,35,58,0.98)',
      '--border': 'rgba(224,222,244,0.08)', '--border-med': 'rgba(224,222,244,0.14)', '--border-strong': 'rgba(224,222,244,0.22)',
      '--surface-sidebar': 'rgba(15,14,22,0.97)',
      '--accent': '#c4a7e7', '--accent-hover': '#ad8ed4', '--accent-light': '#d8c0f0', '--accent-subtle': 'rgba(196,167,231,0.10)', '--accent-subtle2': 'rgba(196,167,231,0.18)', '--accent-glow': 'rgba(196,167,231,0.28)',
    },
  },
};

/* ─── Font stacks ─────────────────────────────────────────── */
export const EDITOR_FONTS: { id: string; label: string; stack: string; mono?: boolean }[] = [
  { id: 'google-sans',   label: 'Google Sans',     stack: "'Google Sans Flex','Google Sans','DM Sans',sans-serif" },
  { id: 'georgia',       label: 'Georgia',          stack: "Georgia,'Times New Roman',serif" },
  { id: 'palatino',      label: 'Palatino',         stack: "'Palatino Linotype',Palatino,'Book Antiqua',serif" },
  { id: 'garamond',      label: 'EB Garamond',      stack: "'EB Garamond',Garamond,serif" },
  { id: 'merriweather',  label: 'Merriweather',     stack: "Merriweather,Georgia,serif" },
  { id: 'lora',          label: 'Lora',             stack: "Lora,Georgia,serif" },
  { id: 'jetbrains',     label: 'JetBrains Mono',   stack: "'JetBrains Mono','Fira Code',monospace", mono: true },
  { id: 'fira-code',     label: 'Fira Code',        stack: "'Fira Code','Cascadia Code',monospace", mono: true },
  { id: 'ibm-plex-mono', label: 'IBM Plex Mono',    stack: "'IBM Plex Mono','Courier New',monospace", mono: true },
  { id: 'source-code',   label: 'Source Code Pro',  stack: "'Source Code Pro',monospace", mono: true },
  { id: 'hack',          label: 'Hack',             stack: "Hack,'Courier New',monospace", mono: true },
];

export const UI_FONTS: { id: string; label: string; stack: string }[] = [
  { id: 'google-sans', label: 'Google Sans', stack: "'Google Sans Flex','Google Sans','DM Sans',sans-serif" },
  { id: 'system',      label: 'System UI',   stack: "system-ui,-apple-system,sans-serif" },
  { id: 'inter',       label: 'Inter',       stack: "'Inter',sans-serif" },
  { id: 'dm-sans',     label: 'DM Sans',     stack: "'DM Sans',sans-serif" },
  { id: 'plus-jakarta',label: 'Plus Jakarta',stack: "'Plus Jakarta Sans',sans-serif" },
];

export const ACCENT_COLORS = [
  { id: 'purple', label: 'Violet',   value: '#9875c1' },
  { id: 'blue',   label: 'Blue',     value: '#2f81f7' },
  { id: 'teal',   label: 'Teal',     value: '#14b8a6' },
  { id: 'green',  label: 'Green',    value: '#22c55e' },
  { id: 'amber',  label: 'Amber',    value: '#f59e0b' },
  { id: 'rose',   label: 'Rose',     value: '#f43f5e' },
  { id: 'orange', label: 'Orange',   value: '#f97316' },
  { id: 'indigo', label: 'Indigo',   value: '#6366f1' },
];

/* ─── Apply settings to DOM ──────────────────────────────── */
export function applySettings(settings: AppSettings): boolean {
  const theme = THEMES[settings.theme] ?? THEMES['default-dark'];
  const isDark = theme.dark;
  const root = document.documentElement;

  // Apply theme CSS vars on :root
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));

  // If theme doesn't define accent, apply user accent
  if (!theme.vars['--accent']) {
    const hex = settings.accentColor;
    root.style.setProperty('--accent', hex);
    root.style.setProperty('--accent-hover', hex + 'cc');
    root.style.setProperty('--accent-light', hex + 'aa');
    root.style.setProperty('--accent-subtle', hex + '18');
    root.style.setProperty('--accent-subtle2', hex + '28');
    root.style.setProperty('--accent-glow', hex + '40');
  }

  // Editor font
  const edFont = EDITOR_FONTS.find(f => f.id === settings.editorFont)?.stack ?? EDITOR_FONTS[0].stack;
  root.style.setProperty('--editor-font', edFont);
  root.style.setProperty('--editor-font-size', settings.editorFontSize + 'px');
  root.style.setProperty('--editor-line-height', String(settings.lineHeight));
  root.style.setProperty('--editor-max-width', settings.maxWidth + 'px');

  // UI font
  const uiFont = UI_FONTS.find(f => f.id === settings.uiFont)?.stack ?? UI_FONTS[0].stack;
  root.style.setProperty('--ui-font', uiFont);

  // Reduced motion
  if (settings.reducedMotion) root.classList.add('reduced-motion');
  else root.classList.remove('reduced-motion');

  // High contrast
  if (settings.highContrast) root.classList.add('high-contrast');
  else root.classList.remove('high-contrast');

  return isDark;
}

/* ─── Load / save helpers ─────────────────────────────────── */
export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem('cs-settings');
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(s: AppSettings) {
  localStorage.setItem('cs-settings', JSON.stringify(s));
  // Persist dark flag for legacy code
  const theme = THEMES[s.theme] ?? THEMES['default-dark'];
  localStorage.setItem('cs-dark', theme.dark ? 'true' : 'false');
}

/* ─── Section tabs ────────────────────────────────────────── */
const SECTIONS = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'editor',     label: 'Editor',     icon: Type },
  { id: 'display',    label: 'Display',    icon: Monitor },
  { id: 'behaviour',  label: 'Behaviour',  icon: Eye },
  { id: 'advanced',   label: 'Advanced',   icon: Sliders },
  { id: 'shortcuts',  label: 'Shortcuts',  icon: Keyboard },
];

/* ─── Helpers ─────────────────────────────────────────────── */
function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>{hint}</div>}
      </div>
      <div style={{ flexShrink: 0, marginLeft: 16 }}>{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
        background: value ? 'var(--accent)' : 'var(--border-strong)',
        position: 'relative', transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 2, left: value ? 20 : 2,
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
      }} />
    </button>
  );
}

function Select({ value, onChange, options }: { value: string | number; onChange: (v: any) => void; options: { value: string | number; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.type === 'number' ? Number(e.target.value) : e.target.value)}
      style={{
        background: 'var(--bg-alt)', border: '1px solid var(--border-med)',
        color: 'var(--text)', borderRadius: 'var(--r-sm)', padding: '4px 8px',
        fontSize: 12, cursor: 'pointer', minWidth: 140,
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Slider({ value, min, max, step, onChange, suffix }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: 110, accentColor: 'var(--accent)' }}
      />
      <span style={{ fontSize: 11, color: 'var(--text-4)', minWidth: 36, textAlign: 'right' }}>{value}{suffix}</span>
    </div>
  );
}

/* ─── Theme card ──────────────────────────────────────────── */
function ThemeCard({ themeId, current, onClick }: { themeId: string; current: boolean; onClick: () => void }) {
  const t = THEMES[themeId];
  const bg = t.vars['--bg'] ?? '#0a0a0a';
  const bgAlt = t.vars['--bg-alt'] ?? '#111';
  const acc = t.vars['--accent'] ?? '#9875c1';
  const txt = t.vars['--text'] ?? '#f0f0f0';
  const txt4 = t.vars['--text-4'] ?? '#666';
  const border = t.vars['--border'] ?? 'rgba(255,255,255,0.1)';

  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative', borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
        border: current ? `2px solid ${acc}` : '2px solid var(--border)',
        background: bg, padding: 0, transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: current ? `0 0 0 3px ${acc}30` : 'none',
      }}
    >
      {/* Mini editor preview */}
      <div style={{ padding: '8px 10px', background: bgAlt, borderBottom: `1px solid ${border}` }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
          {['#ff6058', '#ffbd2e', '#28ca42'].map(c => (
            <div key={c} style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ height: 4, width: '70%', borderRadius: 2, background: acc, opacity: 0.9 }} />
          <div style={{ height: 3, width: '90%', borderRadius: 2, background: txt, opacity: 0.4 }} />
          <div style={{ height: 3, width: '55%', borderRadius: 2, background: txt4, opacity: 0.6 }} />
          <div style={{ height: 3, width: '80%', borderRadius: 2, background: txt, opacity: 0.3 }} />
        </div>
      </div>
      <div style={{ padding: '5px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: txt4, fontWeight: 500 }}>{t.label}</span>
        {current && <Check size={10} color={acc} />}
      </div>
    </button>
  );
}

/* ─── Keyboard shortcut row ───────────────────────────────── */
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

/* ─── Main component ──────────────────────────────────────── */
interface SettingsModalProps {
  onClose: () => void;
  settings: AppSettings;
  onChange: (s: AppSettings) => void;
}

export default function SettingsModal({ onClose, settings, onChange }: SettingsModalProps) {
  const [section, setSection] = useState<string>('appearance');
  const [localSettings, setLocalSettings] = useState<AppSettings>({ ...settings });

  const update = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setLocalSettings(prev => {
      const next = { ...prev, [key]: value };
      onChange(next);
      return next;
    });
  }, [onChange]);

  // Close on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  const themeGroups = [
    { label: 'Dark', ids: ['default-dark', 'catppuccin-mocha', 'darcula', 'monokai', 'nord', 'github-dark', 'tokyo-night', 'rose-pine', 'solarized-dark'] },
    { label: 'Light', ids: ['default-light', 'catppuccin-latte', 'solarized-light'] },
  ];

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="glass-overlay"
        style={{
          width: 780, maxWidth: '95vw', height: 580, maxHeight: '90vh',
          borderRadius: 'var(--r-xl)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'fadeUp 0.18s ease',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-med)', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Settings</div>
            <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 1 }}>Customise your Scribe experience</div>
          </div>
          <button
            onClick={onClose}
            className="tb-btn"
            style={{ width: 28, height: 28, borderRadius: 'var(--r-sm)', padding: 0, color: 'var(--text-4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar nav */}
          <div style={{ width: 152, flexShrink: 0, borderRight: '1px solid var(--border)', padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--surface-sidebar)' }}>
            {SECTIONS.map(s => {
              const Icon = s.icon;
              const active = section === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSection(s.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                    borderRadius: 'var(--r-md)', border: 'none', cursor: 'pointer', textAlign: 'left',
                    background: active ? 'var(--accent-subtle2)' : 'transparent',
                    color: active ? 'var(--accent)' : 'var(--text-4)',
                    fontSize: 12, fontWeight: active ? 600 : 500, transition: 'all 0.12s',
                  }}
                >
                  <Icon size={13} strokeWidth={2} />
                  {s.label}
                </button>
              );
            })}
            <div style={{ flex: 1 }} />
            <div style={{ fontSize: 10, color: 'var(--text-4)', padding: '8px 10px', opacity: 0.6 }}>
              Changes apply instantly
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>

            {/* ── APPEARANCE ── */}
            {section === 'appearance' && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-4)', textTransform: 'uppercase', marginBottom: 12 }}>Themes</div>
                {themeGroups.map(g => (
                  <div key={g.label} style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-4)', marginBottom: 8 }}>{g.label}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))', gap: 8 }}>
                      {g.ids.map(id => (
                        <ThemeCard key={id} themeId={id} current={localSettings.theme === id} onClick={() => update('theme', id)} />
                      ))}
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-4)', textTransform: 'uppercase', marginBottom: 10 }}>Accent Color</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {ACCENT_COLORS.map(c => (
                      <button
                        key={c.id}
                        title={c.label}
                        onClick={() => update('accentColor', c.value)}
                        style={{
                          width: 28, height: 28, borderRadius: '50%', background: c.value,
                          border: localSettings.accentColor === c.value ? '3px solid var(--text)' : '3px solid transparent',
                          cursor: 'pointer', outline: 'none', transition: 'border-color 0.15s, transform 0.1s',
                          transform: localSettings.accentColor === c.value ? 'scale(1.15)' : 'scale(1)',
                          boxShadow: `0 0 0 1px ${c.value}55`,
                        }}
                      />
                    ))}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-4)' }}>Custom:</span>
                      <input
                        type="color"
                        value={localSettings.accentColor}
                        onChange={e => update('accentColor', e.target.value)}
                        style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0, background: 'none' }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-4)', textTransform: 'uppercase', marginBottom: 10 }}>UI Font</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {UI_FONTS.map(f => (
                      <button
                        key={f.id}
                        onClick={() => update('uiFont', f.id)}
                        style={{
                          padding: '5px 12px', borderRadius: 20, border: '1px solid',
                          borderColor: localSettings.uiFont === f.id ? 'var(--accent)' : 'var(--border-med)',
                          background: localSettings.uiFont === f.id ? 'var(--accent-subtle2)' : 'var(--bg-alt)',
                          color: localSettings.uiFont === f.id ? 'var(--accent)' : 'var(--text-3)',
                          fontSize: 12, cursor: 'pointer', fontFamily: f.stack, transition: 'all 0.12s',
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── EDITOR ── */}
            {section === 'editor' && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-4)', textTransform: 'uppercase', marginBottom: 4 }}>Editor Font</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 6, marginBottom: 16 }}>
                  {EDITOR_FONTS.map(f => (
                    <button
                      key={f.id}
                      onClick={() => update('editorFont', f.id)}
                      style={{
                        padding: '8px 12px', borderRadius: 8, border: '1px solid',
                        borderColor: localSettings.editorFont === f.id ? 'var(--accent)' : 'var(--border)',
                        background: localSettings.editorFont === f.id ? 'var(--accent-subtle)' : 'var(--bg-alt)',
                        color: localSettings.editorFont === f.id ? 'var(--accent)' : 'var(--text-3)',
                        textAlign: 'left', cursor: 'pointer', transition: 'all 0.12s',
                      }}
                    >
                      <div style={{ fontFamily: f.stack, fontSize: 13 }}>Aa Bb Cc</div>
                      <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 2 }}>
                        {f.label}{f.mono ? ' · Mono' : ''}
                      </div>
                    </button>
                  ))}
                </div>

                <Row label="Font size" hint="Editor text size in pixels">
                  <Slider value={localSettings.editorFontSize} min={11} max={24} step={1} onChange={v => update('editorFontSize', v)} suffix="px" />
                </Row>
                <Row label="Line height" hint="Spacing between lines">
                  <Slider value={localSettings.lineHeight} min={1.2} max={2.4} step={0.05} onChange={v => update('lineHeight', v)} />
                </Row>
              </div>
            )}

            {/* ── DISPLAY ── */}
            {section === 'display' && (
              <div>
                <Row label="Line numbers" hint="Show line numbers in the gutter">
                  <Toggle value={localSettings.lineNumbers} onChange={v => update('lineNumbers', v)} />
                </Row>
                <Row label="Highlight active line" hint="Subtly highlight the current line">
                  <Toggle value={localSettings.highlightActiveLine} onChange={v => update('highlightActiveLine', v)} />
                </Row>
                <Row label="Word wrap" hint="Wrap long lines to fit the editor width">
                  <Toggle value={localSettings.wordWrap} onChange={v => update('wordWrap', v)} />
                </Row>
                <Row label="Show minimap" hint="Show a miniature code overview on the right">
                  <Toggle value={localSettings.showMinimap} onChange={v => update('showMinimap', v)} />
                </Row>
                <Row label="Max content width" hint="Maximum width of the writing area">
                  <Slider value={localSettings.maxWidth} min={480} max={1100} step={20} onChange={v => update('maxWidth', v)} suffix="px" />
                </Row>
                <Row label="Focus mode fade" hint="How much surrounding text fades in focus mode">
                  <Slider value={localSettings.focusFade} min={5} max={80} step={5} onChange={v => update('focusFade', v)} suffix="%" />
                </Row>
                <Row label="Zen mode toolbar" hint="Show toolbar in zen/distraction-free mode">
                  <Toggle value={localSettings.zenToolbar} onChange={v => update('zenToolbar', v)} />
                </Row>
              </div>
            )}

            {/* ── BEHAVIOUR ── */}
            {section === 'behaviour' && (
              <div>
                <Row label="Auto-save" hint="Automatically save documents as you type">
                  <Toggle value={localSettings.autoSave} onChange={v => update('autoSave', v)} />
                </Row>
                <Row label="Spell check" hint="Underline misspelled words in the editor">
                  <Toggle value={localSettings.spellcheck} onChange={v => update('spellcheck', v)} />
                </Row>
                <Row label="Tab size" hint="Number of spaces per tab">
                  <Select
                    value={localSettings.tabSize}
                    onChange={v => update('tabSize', Number(v))}
                    options={[2, 4, 8].map(n => ({ value: n, label: `${n} spaces` }))}
                  />
                </Row>
              </div>
            )}

            {/* ── ADVANCED ── */}
            {section === 'advanced' && (
              <div>
                <Row label="Reduced motion" hint="Disable animations and transitions throughout the UI">
                  <Toggle value={localSettings.reducedMotion} onChange={v => update('reducedMotion', v)} />
                </Row>
                <Row label="High contrast" hint="Increase contrast for text and UI elements">
                  <Toggle value={localSettings.highContrast} onChange={v => update('highContrast', v)} />
                </Row>
                <div style={{ marginTop: 20, padding: 14, borderRadius: 'var(--r-md)', background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 8 }}>Reset to defaults</div>
                  <div style={{ fontSize: 11, color: 'var(--text-4)', marginBottom: 12 }}>This will reset all settings to their default values. Your documents will not be affected.</div>
                  <button
                    onClick={() => { setLocalSettings({ ...DEFAULT_SETTINGS }); onChange({ ...DEFAULT_SETTINGS }); }}
                    style={{
                      padding: '6px 14px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-med)',
                      background: 'var(--bg-deep)', color: 'var(--text-3)', fontSize: 12, cursor: 'pointer',
                    }}
                  >
                    Reset settings
                  </button>
                </div>
              </div>
            )}

            {/* ── SHORTCUTS ── */}
            {section === 'shortcuts' && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-4)', textTransform: 'uppercase', marginBottom: 12 }}>Keyboard Shortcuts</div>
                <ShortcutRow label="Command palette" keys={['⌘', 'K']} />
                <ShortcutRow label="Toggle dark mode" keys={['⌘', 'Shift', 'D']} />
                <ShortcutRow label="Focus mode" keys={['⌘', 'Shift', 'F']} />
                <ShortcutRow label="Zen mode" keys={['⌘', 'Shift', 'Z']} />
                <ShortcutRow label="Split view" keys={['⌘', '\\']} />
                <ShortcutRow label="Bold" keys={['⌘', 'B']} />
                <ShortcutRow label="Italic" keys={['⌘', 'I']} />
                <ShortcutRow label="Save" keys={['⌘', 'S']} />
                <ShortcutRow label="Find" keys={['⌘', 'F']} />
                <ShortcutRow label="New tab" keys={['⌘', 'T']} />
                <ShortcutRow label="Close tab" keys={['⌘', 'W']} />
                <ShortcutRow label="Navigate tabs" keys={['⌘', '1-9']} />
                <ShortcutRow label="Word count" keys={['⌘', 'Shift', 'C']} />
                <ShortcutRow label="Export markdown" keys={['⌘', 'Shift', 'E']} />
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        select option { background: var(--bg-alt); color: var(--text); }
      `}</style>
    </div>
  );
}
