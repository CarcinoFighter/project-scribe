'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, Eye, Keyboard, Monitor, Palette, Sliders, Type, X } from 'lucide-react';
import { requestPushSubscription } from '@/lib/usePushSubscription';
import {
  ACCENT_COLORS,
  DEFAULT_SETTINGS,
  EDITOR_FONTS,
  THEMES,
  UI_FONTS,
  applySettings,
  loadSettings,
  saveSettings,
} from '@/lib/theme';
import type { AppSettings } from '@/lib/theme';

export {
  ACCENT_COLORS,
  DEFAULT_SETTINGS,
  THEMES,
  applySettings,
  loadSettings,
  saveSettings,
};
export type { AppSettings };

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ paddingRight: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>{label}</div>
        {hint ? <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 3 }}>{hint}</div> : null}
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
        position: 'relative',
        width: 40,
        height: 22,
        borderRadius: 11,
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        outline: 'none',
        background: value ? 'var(--accent)' : 'var(--border-strong)',
        transition: 'background 0.18s',
      }}
    >
      <span
        style={{
          display: 'block',
          position: 'absolute',
          top: 2,
          left: value ? 20 : 2,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.18s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.28)',
        }}
      />
    </button>
  );
}

function Slider({
  value,
  min,
  max,
  step,
  onChange,
  suffix,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: 110, accentColor: 'var(--accent)', cursor: 'pointer' }}
      />
      <span style={{ fontSize: 11, color: 'var(--text-4)', minWidth: 40, textAlign: 'right' }}>
        {value}
        {suffix}
      </span>
    </div>
  );
}

function ThemeCard({ id, selected, onClick }: { id: string; selected: boolean; onClick: () => void }) {
  const theme = THEMES[id];
  if (!theme) return null;

  const bg = theme.vars['--bg'] ?? '#111';
  const bgAlt = theme.vars['--bg-alt'] ?? '#222';
  const accent = theme.vars['--accent'] ?? '#9875c1';
  const text = theme.vars['--text'] ?? '#eee';
  const muted = theme.vars['--text-4'] ?? '#888';
  const border = theme.vars['--border'] ?? 'rgba(255,255,255,0.12)';

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        padding: 0,
        cursor: 'pointer',
        outline: 'none',
        borderRadius: 10,
        overflow: 'hidden',
        border: selected ? `2px solid ${accent}` : `2px solid ${border}`,
        boxShadow: selected ? `0 0 0 3px ${accent}44` : 'none',
        background: bg,
        transition: 'border-color 0.12s, box-shadow 0.12s',
      }}
    >
      <div style={{ padding: '8px 10px', background: bgAlt, borderBottom: `1px solid ${border}` }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 7 }}>
          {['#ff6058', '#ffbd2e', '#28ca42'].map((color) => (
            <div key={color} style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ height: 4, width: '65%', borderRadius: 2, background: accent, opacity: 0.9 }} />
          <div style={{ height: 3, width: '88%', borderRadius: 2, background: text, opacity: 0.35 }} />
          <div style={{ height: 3, width: '52%', borderRadius: 2, background: muted, opacity: 0.55 }} />
          <div style={{ height: 3, width: '76%', borderRadius: 2, background: text, opacity: 0.22 }} />
        </div>
      </div>
      <div style={{ padding: '5px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: muted, fontWeight: 500 }}>{theme.label}</span>
        {selected ? <Check size={10} color={accent} strokeWidth={3} /> : null}
      </div>
    </button>
  );
}

function ShortcutRow({ label, keys }: { label: string; keys: string[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{label}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {keys.map((key, index) => (
          <kbd
            key={`${key}-${index}`}
            style={{
              padding: '2px 7px',
              borderRadius: 5,
              background: 'var(--bg-deep)',
              border: '1px solid var(--border-med)',
              fontSize: 10,
              color: 'var(--text-3)',
              fontFamily: 'monospace',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
            }}
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}

const NAV_SECTIONS = [
  { id: 'appearance', label: 'Appearance', Icon: Palette },
  { id: 'editor', label: 'Editor', Icon: Type },
  { id: 'display', label: 'Display', Icon: Monitor },
  { id: 'behaviour', label: 'Behaviour', Icon: Eye },
  { id: 'advanced', label: 'Advanced', Icon: Sliders },
  { id: 'shortcuts', label: 'Shortcuts', Icon: Keyboard },
] as const;

export default function SettingsModal({
  settings,
  onClose,
  onChange,
}: {
  settings: AppSettings;
  onClose: () => void;
  onChange: (next: AppSettings) => void;
}) {
  const [section, setSection] = useState('appearance');
  const [local, setLocal] = useState<AppSettings>(() => ({ ...settings }));
  const localRef = useRef<AppSettings>(local);

  useEffect(() => {
    localRef.current = local;
  }, [local]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  function update<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    const next = { ...localRef.current, [key]: value };
    localRef.current = next;
    setLocal(next);
    onChange(next);
  }

  function reset() {
    const next = { ...DEFAULT_SETTINGS };
    localRef.current = next;
    setLocal(next);
    onChange(next);
  }

  const themeGroups = [
    { label: 'Dark', ids: ['default-dark', 'catppuccin-mocha', 'darcula', 'dracula', 'monokai', 'one-dark', 'night-owl', 'material-ocean', 'nord', 'github-dark', 'tokyo-night', 'rose-pine', 'gruvbox-dark', 'ayu-dark', 'everforest-dark', 'kanagawa', 'poimandres', 'solarized-dark'] },
    { label: 'Light', ids: ['default-light', 'catppuccin-latte', 'github-light', 'gruvbox-light', 'ayu-light', 'everforest-light', 'paper', 'solarized-light'] },
  ];

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        onMouseDown={(event) => event.stopPropagation()}
        style={{
          width: 800,
          maxWidth: '96vw',
          height: 590,
          maxHeight: '92vh',
          borderRadius: 'var(--r-xl)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--surface-2)',
          border: '1px solid var(--border-med)',
          boxShadow: 'var(--sh-lg)',
          animation: 'sm-fadein 0.16s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-med)', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Settings</div>
            <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 3 }}>Customise your Vantage experience</div>
          </div>
          <button type="button" onClick={onClose} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--r-sm)', border: 'none', background: 'transparent', color: 'var(--text-4)', cursor: 'pointer', outline: 'none' }}>
            <X size={15} />
          </button>
        </div>

        <div className="settings-modal-inner" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <nav className="settings-nav" style={{ width: 156, flexShrink: 0, borderRight: '1px solid var(--border)', padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--surface-sidebar)', overflowY: 'auto' }}>
            {NAV_SECTIONS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 10px',
                  width: '100%',
                  borderRadius: 'var(--r-md)',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  outline: 'none',
                  background: section === id ? 'var(--accent-subtle2)' : 'transparent',
                  color: section === id ? 'var(--accent)' : 'var(--text-4)',
                  fontSize: 12,
                  fontWeight: section === id ? 600 : 500,
                  transition: 'all 0.1s',
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

          <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px' }}>
            {section === 'appearance' ? (
              <>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-4)', textTransform: 'uppercase', margin: '0 0 10px' }}>Theme</p>
                {themeGroups.map((group) => (
                  <div key={group.label} style={{ marginBottom: 18 }}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-4)', margin: '0 0 8px' }}>{group.label}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(100px,1fr))', gap: 8 }}>
                      {group.ids.map((id) => (
                        <ThemeCard key={id} id={id} selected={local.theme === id} onClick={() => update('theme', id)} />
                      ))}
                    </div>
                  </div>
                ))}

                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-4)', textTransform: 'uppercase', margin: '20px 0 10px' }}>Accent Colour</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {ACCENT_COLORS.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      title={color.label}
                      onClick={() => update('accentColor', color.value)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        border: 'none',
                        cursor: 'pointer',
                        background: color.value,
                        outline: local.accentColor === color.value ? '3px solid var(--text)' : '3px solid transparent',
                        outlineOffset: 2,
                        transform: local.accentColor === color.value ? 'scale(1.18)' : 'scale(1)',
                        transition: 'transform 0.12s, outline-color 0.12s',
                        boxShadow: `0 0 0 1px ${color.value}55`,
                      }}
                    />
                  ))}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-4)' }}>Custom</span>
                    <input
                      type="color"
                      value={local.accentColor}
                      onChange={(e) => update('accentColor', e.target.value)}
                      style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0 }}
                    />
                  </label>
                </div>

                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-4)', textTransform: 'uppercase', margin: '20px 0 10px' }}>UI Font</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {UI_FONTS.map((font) => (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => update('uiFont', font.id)}
                      style={{
                        padding: '5px 13px',
                        borderRadius: 20,
                        border: '1px solid',
                        cursor: 'pointer',
                        outline: 'none',
                        borderColor: local.uiFont === font.id ? 'var(--accent)' : 'var(--border-med)',
                        background: local.uiFont === font.id ? 'var(--accent-subtle2)' : 'var(--bg-alt)',
                        color: local.uiFont === font.id ? 'var(--accent)' : 'var(--text-3)',
                        fontSize: 12,
                        fontFamily: font.stack,
                        transition: 'all 0.1s',
                      }}
                    >
                      {font.label}
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            {section === 'editor' ? (
              <>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-4)', textTransform: 'uppercase', margin: '0 0 10px' }}>Editor Font</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(175px,1fr))', gap: 6, marginBottom: 20 }}>
                  {EDITOR_FONTS.map((font) => (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => update('editorFont', font.id)}
                      style={{
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: '1px solid',
                        textAlign: 'left',
                        cursor: 'pointer',
                        outline: 'none',
                        transition: 'all 0.1s',
                        borderColor: local.editorFont === font.id ? 'var(--accent)' : 'var(--border)',
                        background: local.editorFont === font.id ? 'var(--accent-subtle)' : 'var(--bg-alt)',
                        color: local.editorFont === font.id ? 'var(--accent)' : 'var(--text-3)',
                      }}
                    >
                      <div style={{ fontFamily: font.stack, fontSize: 14 }}>Aa Bb Cc</div>
                      <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 4 }}>
                        {font.label}
                        {font.mono ? ' · Mono' : ''}
                      </div>
                    </button>
                  ))}
                </div>
                <Row label="Font size" hint="Editor text size">
                  <Slider value={local.editorFontSize} min={11} max={24} step={1} onChange={(value) => update('editorFontSize', value)} suffix="px" />
                </Row>
                <Row label="Line height" hint="Vertical spacing between lines">
                  <Slider value={local.lineHeight} min={1.2} max={2.4} step={0.05} onChange={(value) => update('lineHeight', Number(value.toFixed(2)))} />
                </Row>
              </>
            ) : null}

            {section === 'display' ? (
              <>
                <Row label="Line numbers" hint="Show line numbers in the gutter">
                  <Toggle value={local.lineNumbers} onChange={(value) => update('lineNumbers', value)} />
                </Row>
                <Row label="Highlight active line" hint="Subtly highlight the line the cursor is on">
                  <Toggle value={local.highlightActiveLine} onChange={(value) => update('highlightActiveLine', value)} />
                </Row>
                <Row label="Word wrap" hint="Wrap long lines within the editor width">
                  <Toggle value={local.wordWrap} onChange={(value) => update('wordWrap', value)} />
                </Row>
                <Row label="Show minimap" hint="Show a miniature document overview on the right">
                  <Toggle value={local.showMinimap} onChange={(value) => update('showMinimap', value)} />
                </Row>
                <Row label="Max content width" hint="Maximum width of the writing area">
                  <Slider value={local.maxWidth} min={480} max={1100} step={20} onChange={(value) => update('maxWidth', value)} suffix="px" />
                </Row>
                <Row label="Focus mode fade" hint="Opacity of non-active lines in focus mode">
                  <Slider value={local.focusFade} min={5} max={80} step={5} onChange={(value) => update('focusFade', value)} suffix="%" />
                </Row>
                <Row label="Zen mode toolbar" hint="Keep the toolbar visible in zen mode">
                  <Toggle value={local.zenToolbar} onChange={(value) => update('zenToolbar', value)} />
                </Row>
              </>
            ) : null}

            {section === 'behaviour' ? (
              <>
                <Row label="Auto-save" hint="Automatically save documents as you type">
                  <Toggle value={local.autoSave} onChange={(value) => update('autoSave', value)} />
                </Row>
                <Row label="Spell check" hint="Underline misspelled words in the editor">
                  <Toggle value={local.spellcheck} onChange={(value) => update('spellcheck', value)} />
                </Row>
                <Row label="Tab size" hint="Spaces inserted per Tab keypress">
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[2, 4, 8].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => update('tabSize', size)}
                        style={{
                          padding: '4px 12px',
                          borderRadius: 'var(--r-sm)',
                          border: '1px solid',
                          cursor: 'pointer',
                          outline: 'none',
                          fontSize: 12,
                          transition: 'all 0.1s',
                          borderColor: local.tabSize === size ? 'var(--accent)' : 'var(--border-med)',
                          background: local.tabSize === size ? 'var(--accent-subtle2)' : 'var(--bg-alt)',
                          color: local.tabSize === size ? 'var(--accent)' : 'var(--text-3)',
                        }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </Row>
                <Row label="Push notifications" hint="Enable push notifications for updates (required on mobile)">
                  <button
                    type="button"
                    onClick={() => requestPushSubscription().catch(console.error)}
                    style={{ padding: '6px 14px', borderRadius: 'var(--r-sm)', border: '1px solid var(--accent)', background: 'var(--accent)', color: 'var(--paper)', fontSize: 11, fontWeight: 600, cursor: 'pointer', outline: 'none', letterSpacing: '0.04em' }}
                  >
                    Enable
                  </button>
                </Row>
              </>
            ) : null}

            {section === 'advanced' ? (
              <>
                <Row label="Reduced motion" hint="Disable animations and transitions">
                  <Toggle value={local.reducedMotion} onChange={(value) => update('reducedMotion', value)} />
                </Row>
                <Row label="High contrast" hint="Increase border and text contrast">
                  <Toggle value={local.highContrast} onChange={(value) => update('highContrast', value)} />
                </Row>
                <div style={{ marginTop: 24, padding: 16, borderRadius: 'var(--r-md)', background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 6 }}>Reset to defaults</div>
                  <div style={{ fontSize: 11, color: 'var(--text-4)', marginBottom: 14, lineHeight: 1.5 }}>
                    Resets all settings. Your documents are not affected.
                  </div>
                  <button
                    type="button"
                    onClick={reset}
                    style={{ padding: '6px 14px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-med)', background: 'var(--bg-deep)', color: 'var(--text-3)', fontSize: 12, cursor: 'pointer', outline: 'none' }}
                  >
                    Reset settings
                  </button>
                </div>
              </>
            ) : null}

            {section === 'shortcuts' ? (
              <>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-4)', textTransform: 'uppercase', margin: '0 0 12px' }}>Keyboard Shortcuts</p>
                <ShortcutRow label="Command palette" keys={['⌘', 'K']} />
                <ShortcutRow label="Toggle dark mode" keys={['⌘', 'Shift', 'D']} />
                <ShortcutRow label="Focus mode" keys={['⌘', 'Shift', 'F']} />
                <ShortcutRow label="Zen mode" keys={['⌘', 'Shift', 'Z']} />
                <ShortcutRow label="Bold" keys={['⌘', 'B']} />
                <ShortcutRow label="Italic" keys={['⌘', 'I']} />
                <ShortcutRow label="Underline" keys={['⌘', 'U']} />
                <ShortcutRow label="Save" keys={['⌘', 'S']} />
                <ShortcutRow label="Find" keys={['⌘', 'F']} />
                <ShortcutRow label="New tab" keys={['⌘', 'T']} />
                <ShortcutRow label="Close tab" keys={['⌘', 'W']} />
                <ShortcutRow label="Navigate tabs" keys={['⌘', '1-9']} />
                <ShortcutRow label="Export markdown" keys={['⌘', 'Shift', 'E']} />
              </>
            ) : null}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sm-fadein {
          from { opacity: 0; transform: translateY(10px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
