'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Bell, Check, Eye, Keyboard, LayoutDashboard, Monitor,
  Palette, Sliders, Type, X, Search, RotateCcw, ChevronRight,
} from 'lucide-react';
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

/* ─── Sub-components ──────────────────────────────────────────────────────── */

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="stm-section-hdr">
      <div>
        <h3 className="stm-section-title">{title}</h3>
        {description && <p className="stm-section-desc">{description}</p>}
      </div>
      <hr className="db-triple-rule" style={{ marginTop: '12px', marginBottom: '0' }} />
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="stm-row">
      <div className="stm-row-text">
        <span className="stm-row-label">{label}</span>
        {hint && <span className="stm-row-hint">{hint}</span>}
      </div>
      <div className="stm-row-ctrl">{children}</div>
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
      className={`stm-toggle ${value ? 'on' : ''}`}
    >
      <div className="stm-toggle-box">
        {value && <Check size={12} strokeWidth={3} />}
      </div>
      <span className="db-cap" style={{ marginTop: '2px' }}>{value ? 'ON' : 'OFF'}</span>
    </button>
  );
}

function Slider({
  value, min, max, step, onChange, suffix,
}: {
  value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; suffix?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="stm-slider-wrap">
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="stm-slider"
        style={{ '--slider-pct': `${pct}%` } as React.CSSProperties}
      />
      <span className="stm-slider-val">{value}{suffix}</span>
    </div>
  );
}

function SegmentControl<T extends string>({
  options, value, onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="stm-segment">
      {options.map(opt => (
        <button
          key={opt.id}
          type="button"
          className={`stm-segment-btn ${value === opt.id ? 'active' : ''}`}
          onClick={() => onChange(opt.id)}
        >
          {opt.label}
        </button>
      ))}
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
      className={`stm-theme-card ${selected ? 'selected' : ''}`}
      style={{
        '--tc-bg': bg,
        '--tc-bg-alt': bgAlt,
        '--tc-accent': accent,
        '--tc-text': text,
        '--tc-muted': muted,
        '--tc-border': border,
      } as React.CSSProperties}
    >
      <div className="stm-tc-preview">
        <div className="stm-tc-dots">
          <div className="stm-tc-dot" style={{ background: '#ff6058' }} />
          <div className="stm-tc-dot" style={{ background: '#ffbd2e' }} />
          <div className="stm-tc-dot" style={{ background: '#28ca42' }} />
        </div>
        <div className="stm-tc-lines">
          <div className="stm-tc-line" style={{ width: '62%', background: accent, opacity: 0.9 }} />
          <div className="stm-tc-line" style={{ width: '85%', background: text, opacity: 0.3 }} />
          <div className="stm-tc-line" style={{ width: '48%', background: muted, opacity: 0.5 }} />
          <div className="stm-tc-line" style={{ width: '74%', background: text, opacity: 0.2 }} />
        </div>
      </div>
      <div className="stm-tc-footer">
        <span className="stm-tc-name db-cap">{theme.label}</span>
        {selected && (
          <div className="stm-tc-check">
            <Check size={9} strokeWidth={3} />
          </div>
        )}
      </div>
    </button>
  );
}

function ShortcutRow({ label, keys }: { label: string; keys: string[] }) {
  return (
    <div className="stm-shortcut-row">
      <span className="stm-shortcut-label db-cap">{label}</span>
      <div className="stm-shortcut-keys">
        {keys.map((key, i) => (
          <kbd key={`${key}-${i}`} className="db-kbd">{key}</kbd>
        ))}
      </div>
    </div>
  );
}

/* ─── Nav sections ────────────────────────────────────────────────────────── */

const NAV_SECTIONS = [
  { id: 'appearance', label: 'Appearance', Icon: Palette },
  { id: 'editor', label: 'Editor', Icon: Type },
  { id: 'display', label: 'Display', Icon: Monitor },
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'notifications', label: 'Notifications', Icon: Bell },
  { id: 'behaviour', label: 'Behaviour', Icon: Eye },
  { id: 'advanced', label: 'Advanced', Icon: Sliders },
  { id: 'shortcuts', label: 'Shortcuts', Icon: Keyboard },
] as const;

/* ─── Main Component ──────────────────────────────────────────────────────── */

export default function SettingsModal({
  settings, onClose, onChange,
}: {
  settings: AppSettings;
  onClose: () => void;
  onChange: (next: AppSettings) => void;
}) {
  const [section, setSection] = useState('appearance');
  const [local, setLocal] = useState<AppSettings>(() => ({ ...settings }));
  const [searchQuery, setSearchQuery] = useState('');
  const localRef = useRef<AppSettings>(local);
  const contentRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { localRef.current = local; }, [local]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [section]);

  const update = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const next = { ...localRef.current, [key]: value };
    localRef.current = next;
    setLocal(next);
    onChange(next);
  }, [onChange]);

  const reset = useCallback(() => {
    const next = { ...DEFAULT_SETTINGS };
    localRef.current = next;
    setLocal(next);
    onChange(next);
  }, [onChange]);

  const themeGroups = [
    { label: 'Dark', ids: ['default-dark', 'catppuccin-mocha', 'darcula', 'dracula', 'monokai', 'one-dark', 'night-owl', 'material-ocean', 'nord', 'github-dark', 'tokyo-night', 'rose-pine', 'gruvbox-dark', 'ayu-dark', 'everforest-dark', 'kanagawa', 'poimandres', 'solarized-dark'] },
    { label: 'Light', ids: ['default-light', 'catppuccin-latte', 'github-light', 'gruvbox-light', 'ayu-light', 'everforest-light', 'paper', 'solarized-light'] },
  ];

  type SettingMeta = { section: string; label: string; hint?: string };
  const allSettings: SettingMeta[] = [
    { section: 'appearance', label: 'Theme' },
    { section: 'appearance', label: 'Accent Colour' },
    { section: 'appearance', label: 'UI Font' },
    { section: 'editor', label: 'Editor Font' },
    { section: 'editor', label: 'Font size', hint: 'editor text size' },
    { section: 'editor', label: 'Line height', hint: 'spacing between lines' },
    { section: 'editor', label: 'Editor padding', hint: 'horizontal padding' },
    { section: 'editor', label: 'Show whitespace', hint: 'render whitespace characters' },
    { section: 'editor', label: 'Bracket pair highlight', hint: 'matching brackets' },
    { section: 'editor', label: 'Smooth caret', hint: 'cursor animation' },
    { section: 'display', label: 'Line numbers' },
    { section: 'display', label: 'Highlight active line' },
    { section: 'display', label: 'Word wrap' },
    { section: 'display', label: 'Show minimap' },
    { section: 'display', label: 'Max content width' },
    { section: 'display', label: 'Focus mode fade' },
    { section: 'display', label: 'Zen mode toolbar' },
    { section: 'display', label: 'Sidebar position', hint: 'left or right' },
    { section: 'display', label: 'Compact sidebar' },
    { section: 'dashboard', label: 'Dashboard layout', hint: 'density' },
    { section: 'dashboard', label: 'Word goal widget' },
    { section: 'dashboard', label: 'Recent documents' },
    { section: 'dashboard', label: 'Start page', hint: 'landing page on login' },
    { section: 'notifications', label: 'Notification sound' },
    { section: 'notifications', label: 'Desktop notifications' },
    { section: 'notifications', label: 'Badge count' },
    { section: 'notifications', label: 'Push notifications' },
    { section: 'behaviour', label: 'Auto-save' },
    { section: 'behaviour', label: 'Auto-save delay', hint: 'seconds' },
    { section: 'behaviour', label: 'Spell check' },
    { section: 'behaviour', label: 'Tab size' },
    { section: 'behaviour', label: 'Confirm delete', hint: 'ask before deleting' },
    { section: 'advanced', label: 'Reduced motion', hint: 'disable animations' },
    { section: 'advanced', label: 'High contrast' },
    { section: 'advanced', label: 'Reset to defaults' },
    { section: 'shortcuts', label: 'Keyboard Shortcuts' },
  ];

  const q = searchQuery.trim().toLowerCase();
  const isSearchActive = q.length > 0;

  const matchingSections = isSearchActive
    ? [...new Set(
        allSettings
          .filter(s =>
            s.label.toLowerCase().includes(q) ||
            (s.hint ?? '').toLowerCase().includes(q) ||
            s.section.toLowerCase().includes(q)
          )
          .map(s => s.section)
      )]
    : [];

  const visibleSections = isSearchActive
    ? NAV_SECTIONS.filter(sec => matchingSections.includes(sec.id))
    : NAV_SECTIONS;

  const shouldShowSection = (sectionId: string) => {
    if (!isSearchActive) return section === sectionId;
    return matchingSections.includes(sectionId);
  };

  return (
    <div
      className="stm-overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="stm-modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* ── Header ────────────────────────────────────────────── */}
        <div className="stm-header">
          <div className="stm-header-left">
            <div>
              <h2 className="db-display" style={{ fontSize: 24, margin: 0 }}>Settings</h2>
              <p className="db-cap" style={{ marginTop: 2, color: 'var(--mid)' }}>Vantage Environment Configuration</p>
            </div>
          </div>

          <div className="db-search">
            <Search size={12} strokeWidth={2} />
            <input
              ref={searchRef}
              type="text"
              placeholder="SEARCH…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                const newQ = e.target.value.trim().toLowerCase();
                if (newQ.length > 0) {
                  const firstMatch = allSettings.find(s =>
                    s.label.toLowerCase().includes(newQ) ||
                    (s.hint ?? '').toLowerCase().includes(newQ)
                  );
                  if (firstMatch) setSection(firstMatch.section);
                }
              }}
              style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--ink)', width: 140, fontSize: 10, fontFamily: 'var(--ff-mono)' }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="db-ghost"
                style={{ padding: '1px 4px' }}
              >
                ✕
              </button>
            )}
          </div>

          <button type="button" onClick={onClose} className="db-icon-btn" style={{ border: '1px solid var(--rule)' }} title="Close">
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        {/* ── Body ──────────────────────────────────────────────── */}
        <div className="stm-body">
          {/* Sidebar */}
          <nav className="stm-nav">
            <div className="db-sidebar-label">Categories</div>
            {visibleSections.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                className={`db-nav-item ${section === id ? 'active' : ''}`}
              >
                <Icon size={12} strokeWidth={2} style={{ flexShrink: 0 }} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* Content */}
          <div ref={contentRef} className="stm-content">

            {/* ── APPEARANCE ────────────────────────── */}
            {shouldShowSection('appearance') && (
              <div className="stm-section">
                <SectionHeader title="Theme" description="Global colour scheme" />
                {themeGroups.map(group => (
                  <div key={group.label} className="stm-theme-group">
                    <p className="db-cap" style={{ marginBottom: 12 }}>{group.label}</p>
                    <div className="stm-theme-grid">
                      {group.ids.map(id => (
                        <ThemeCard key={id} id={id} selected={local.theme === id} onClick={() => update('theme', id)} />
                      ))}
                    </div>
                  </div>
                ))}

                <SectionHeader title="Accent Colour" description="Highlight and brand colour" />
                <div className="stm-accent-grid">
                  {ACCENT_COLORS.map(color => (
                    <button
                      key={color.id}
                      type="button"
                      title={color.label}
                      onClick={() => update('accentColor', color.value)}
                      className={`stm-accent-swatch ${local.accentColor === color.value ? 'selected' : ''}`}
                      style={{ '--swatch': color.value } as React.CSSProperties}
                    >
                      {local.accentColor === color.value && <Check size={12} strokeWidth={3} />}
                    </button>
                  ))}
                  <label className="stm-custom-color">
                    <span className="db-cap">CUSTOM</span>
                    <input
                      type="color"
                      value={local.accentColor}
                      onChange={(e) => update('accentColor', e.target.value)}
                      className="stm-color-input"
                    />
                  </label>
                </div>

                <SectionHeader title="UI Font" description="Typography for buttons and navigation" />
                <div className="stm-font-pills">
                  {UI_FONTS.map(font => (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => update('uiFont', font.id)}
                      className={`db-ghost ${local.uiFont === font.id ? 'active' : ''}`}
                      style={{ fontFamily: font.stack, textTransform: 'none' }}
                    >
                      {font.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── EDITOR ────────────────────────────── */}
            {shouldShowSection('editor') && (
              <div className="stm-section">
                <SectionHeader title="Editor Font" description="Typeface for the writing area" />
                <div className="stm-editor-font-grid">
                  {EDITOR_FONTS.map(font => (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => update('editorFont', font.id)}
                      className={`stm-editor-font-card ${local.editorFont === font.id ? 'active' : ''}`}
                    >
                      <div className="stm-efc-sample" style={{ fontFamily: font.stack }}>Aa Bb Cc</div>
                      <div className="stm-efc-meta">
                        <span className="db-cap" style={{ color: 'inherit' }}>{font.label}</span>
                        {font.mono && <span className="db-cap" style={{ background: 'var(--accent)', color: 'var(--paper)', padding: '1px 4px' }}>MONO</span>}
                      </div>
                    </button>
                  ))}
                </div>

                <SectionHeader title="Typography" />
                <div className="stm-card-group">
                  <Row label="Font size" hint="Editor text size in pixels">
                    <Slider value={local.editorFontSize} min={11} max={24} step={1} onChange={v => update('editorFontSize', v)} suffix="px" />
                  </Row>
                  <Row label="Line height" hint="Vertical spacing between lines">
                    <Slider value={local.lineHeight} min={1.2} max={2.4} step={0.05} onChange={v => update('lineHeight', Number(v.toFixed(2)))} />
                  </Row>
                  <Row label="Editor padding" hint="Horizontal padding around content">
                    <Slider value={local.editorPadding} min={24} max={80} step={4} onChange={v => update('editorPadding', v)} suffix="px" />
                  </Row>
                </div>

                <SectionHeader title="Features" />
                <div className="stm-card-group">
                  <Row label="Show whitespace" hint="Render space and tab characters visibly">
                    <Toggle value={local.showWhitespace} onChange={v => update('showWhitespace', v)} />
                  </Row>
                  <Row label="Bracket pair highlight" hint="Highlight matching brackets and parentheses">
                    <Toggle value={local.bracketPairHighlight} onChange={v => update('bracketPairHighlight', v)} />
                  </Row>
                  <Row label="Smooth caret" hint="Animate cursor movement in the editor">
                    <Toggle value={local.smoothCaret} onChange={v => update('smoothCaret', v)} />
                  </Row>
                </div>
              </div>
            )}

            {/* ── DISPLAY ───────────────────────────── */}
            {shouldShowSection('display') && (
              <div className="stm-section">
                <SectionHeader title="Editor Display" description="Control how the writing area looks" />
                <div className="stm-card-group">
                  <Row label="Line numbers" hint="Show line numbers in the gutter">
                    <Toggle value={local.lineNumbers} onChange={v => update('lineNumbers', v)} />
                  </Row>
                  <Row label="Highlight active line" hint="Subtly highlight the line the cursor is on">
                    <Toggle value={local.highlightActiveLine} onChange={v => update('highlightActiveLine', v)} />
                  </Row>
                  <Row label="Word wrap" hint="Wrap long lines within the editor width">
                    <Toggle value={local.wordWrap} onChange={v => update('wordWrap', v)} />
                  </Row>
                  <Row label="Show minimap" hint="Miniature document overview on the right">
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
                </div>

                <SectionHeader title="Sidebar" />
                <div className="stm-card-group">
                  <Row label="Sidebar position" hint="Place the sidebar on left or right">
                    <SegmentControl
                      options={[{ id: 'left' as const, label: 'Left' }, { id: 'right' as const, label: 'Right' }]}
                      value={local.sidebarPosition}
                      onChange={v => update('sidebarPosition', v)}
                    />
                  </Row>
                  <Row label="Compact sidebar" hint="Use collapsed sidebar by default">
                    <Toggle value={local.compactSidebar} onChange={v => update('compactSidebar', v)} />
                  </Row>
                </div>
              </div>
            )}

            {/* ── DASHBOARD ─────────────────────────── */}
            {shouldShowSection('dashboard') && (
              <div className="stm-section">
                <SectionHeader title="Layout" description="Control how the dashboard looks and behaves" />
                <div className="stm-card-group">
                  <Row label="Dashboard density" hint="Spacing and size of dashboard cards">
                    <SegmentControl
                      options={[
                        { id: 'compact' as const, label: 'Compact' },
                        { id: 'comfortable' as const, label: 'Comfortable' },
                        { id: 'spacious' as const, label: 'Spacious' },
                      ]}
                      value={local.dashboardLayout}
                      onChange={v => update('dashboardLayout', v)}
                    />
                  </Row>
                  <Row label="Start page" hint="Which page to show after login">
                    <SegmentControl
                      options={[
                        { id: 'home' as const, label: 'Home' },
                        { id: 'editor' as const, label: 'Editor' },
                        { id: 'last-visited' as const, label: 'Last Visited' },
                      ]}
                      value={local.startPage}
                      onChange={v => update('startPage', v)}
                    />
                  </Row>
                </div>

                <SectionHeader title="Widgets" description="Toggle dashboard sections on or off" />
                <div className="stm-card-group">
                  <Row label="Word goal widget" hint="Show word goal progress card on overview">
                    <Toggle value={local.showWordGoalWidget} onChange={v => update('showWordGoalWidget', v)} />
                  </Row>
                  <Row label="Recent documents" hint="Show recent documents section on overview">
                    <Toggle value={local.showRecentDocs} onChange={v => update('showRecentDocs', v)} />
                  </Row>
                </div>
              </div>
            )}

            {/* ── NOTIFICATIONS ─────────────────────── */}
            {shouldShowSection('notifications') && (
              <div className="stm-section">
                <SectionHeader title="Alerts" description="Control how you receive notifications" />
                <div className="stm-card-group">
                  <Row label="Notification sound" hint="Play a tone when new notifications arrive">
                    <Toggle value={local.notifSound} onChange={v => update('notifSound', v)} />
                  </Row>
                  <Row label="Desktop notifications" hint="Show OS-level notification popups">
                    <Toggle value={local.notifDesktop} onChange={v => update('notifDesktop', v)} />
                  </Row>
                  <Row label="Badge count" hint="Show unread count on sidebar and header">
                    <Toggle value={local.notifBadge} onChange={v => update('notifBadge', v)} />
                  </Row>
                  <Row label="Push notifications" hint="Enable push notifications on this device">
                    <button
                      type="button"
                      onClick={() => requestPushSubscription().catch(console.error)}
                      className="db-btn"
                    >
                      <span>Enable Push</span>
                    </button>
                  </Row>
                </div>
              </div>
            )}

            {/* ── BEHAVIOUR ─────────────────────────── */}
            {shouldShowSection('behaviour') && (
              <div className="stm-section">
                <SectionHeader title="Saving" description="Control how documents are saved" />
                <div className="stm-card-group">
                  <Row label="Auto-save" hint="Automatically save documents as you type">
                    <Toggle value={local.autoSave} onChange={v => update('autoSave', v)} />
                  </Row>
                  <Row label="Auto-save delay" hint="Seconds to wait before auto-saving">
                    <Slider value={local.autoSaveDelay} min={1} max={10} step={1} onChange={v => update('autoSaveDelay', v)} suffix="s" />
                  </Row>
                  <Row label="Confirm before delete" hint="Ask for confirmation before deleting documents">
                    <Toggle value={local.confirmDelete} onChange={v => update('confirmDelete', v)} />
                  </Row>
                </div>

                <SectionHeader title="Input" />
                <div className="stm-card-group">
                  <Row label="Spell check" hint="Underline misspelled words in the editor">
                    <Toggle value={local.spellcheck} onChange={v => update('spellcheck', v)} />
                  </Row>
                  <Row label="Tab size" hint="Spaces inserted per Tab keypress">
                    <SegmentControl
                      options={[
                        { id: 2 as any, label: '2' },
                        { id: 4 as any, label: '4' },
                        { id: 8 as any, label: '8' },
                      ]}
                      value={local.tabSize as any}
                      onChange={v => update('tabSize', Number(v))}
                    />
                  </Row>
                </div>
              </div>
            )}

            {/* ── ADVANCED ──────────────────────────── */}
            {shouldShowSection('advanced') && (
              <div className="stm-section">
                <SectionHeader title="Accessibility" description="Options for reduced motion and contrast" />
                <div className="stm-card-group">
                  <Row label="Reduced motion" hint="Disable animations and transitions throughout the app">
                    <Toggle value={local.reducedMotion} onChange={v => update('reducedMotion', v)} />
                  </Row>
                  <Row label="High contrast" hint="Increase border and text contrast for readability">
                    <Toggle value={local.highContrast} onChange={v => update('highContrast', v)} />
                  </Row>
                </div>

                <div className="stm-reset-card">
                  <div className="stm-reset-icon">
                    <RotateCcw size={18} strokeWidth={1.8} />
                  </div>
                  <div className="stm-reset-text">
                    <strong className="db-cap" style={{ fontSize: 11, color: 'var(--ink)' }}>RESET TO DEFAULTS</strong>
                    <p>Restore all settings to their original values. Your documents are not affected.</p>
                  </div>
                  <button type="button" onClick={reset} className="db-ghost" style={{ alignSelf: 'center' }}>
                    Reset
                  </button>
                </div>
              </div>
            )}

            {/* ── SHORTCUTS ─────────────────────────── */}
            {shouldShowSection('shortcuts') && (
              <div className="stm-section">
                <SectionHeader title="Navigation" />
                <div className="stm-card-group">
                  <ShortcutRow label="Command palette" keys={['⌘', 'K']} />
                  <ShortcutRow label="Toggle dark mode" keys={['⌘', 'Shift', 'D']} />
                  <ShortcutRow label="Navigate tabs" keys={['⌘', '1-9']} />
                </div>

                <SectionHeader title="View" />
                <div className="stm-card-group">
                  <ShortcutRow label="Focus mode" keys={['⌘', 'Shift', 'F']} />
                  <ShortcutRow label="Zen mode" keys={['⌘', 'Shift', 'Z']} />
                </div>

                <SectionHeader title="Editing" />
                <div className="stm-card-group">
                  <ShortcutRow label="Bold" keys={['⌘', 'B']} />
                  <ShortcutRow label="Italic" keys={['⌘', 'I']} />
                  <ShortcutRow label="Underline" keys={['⌘', 'U']} />
                  <ShortcutRow label="Find" keys={['⌘', 'F']} />
                </div>

                <SectionHeader title="File" />
                <div className="stm-card-group">
                  <ShortcutRow label="Save" keys={['⌘', 'S']} />
                  <ShortcutRow label="New tab" keys={['⌘', 'T']} />
                  <ShortcutRow label="Close tab" keys={['⌘', 'W']} />
                  <ShortcutRow label="Export markdown" keys={['⌘', 'Shift', 'E']} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Scoped CSS ──────────────────────────────────────────── */}
      <style>{`
        /* ── Overlay ─────────────────────────────── */
        .stm-overlay {
          position: fixed; inset: 0; z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          background: rgba(0,0,0,0.8);
          backdrop-filter: none;
        }

        /* ── Modal ───────────────────────────────── */
        .stm-modal {
          width: 860px; max-width: 96vw;
          height: 640px; max-height: 92vh;
          display: flex; flex-direction: column;
          background: var(--paper);
          border: 1px solid var(--rule);
          border-top: 3px solid var(--accent);
          box-shadow: 20px 20px 0px rgba(0,0,0,0.3);
        }

        /* ── Header ──────────────────────────────── */
        .stm-header {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 16px 24px;
          border-bottom: 1px solid var(--rule);
          flex-shrink: 0;
          background: var(--tape-bg);
        }
        .stm-header-left {
          display: flex; align-items: center; gap: 10px;
        }

        /* ── Body ────────────────────────────────── */
        .stm-body {
          display: flex; flex: 1; overflow: hidden;
        }
        
        /* ── Sidebar ─────────────────────────────── */
        .stm-nav {
          width: 200px; flex-shrink: 0;
          border-right: 1px solid var(--rule);
          padding: 32px 0; overflow-y: auto;
          background: var(--tape-bg);
          display: flex; flex-direction: column;
        }
        .stm-nav .db-sidebar-label {
          margin-bottom: 16px;
          padding: 0 20px;
        }

        /* ── Content area ────────────────────────── */
        .stm-content {
          flex: 1; overflow-y: auto; padding: 32px 48px;
        }
        .stm-content::-webkit-scrollbar { width: 6px; }
        .stm-content::-webkit-scrollbar-track { background: transparent; border-left: 1px solid var(--rule); }
        .stm-content::-webkit-scrollbar-thumb { background: var(--rule); }
        .stm-content::-webkit-scrollbar-thumb:hover { background: var(--mid); }

        /* ── Section headers ─────────────────────── */
        .stm-section { margin-bottom: 48px; }
        .stm-section-hdr { margin: 0 0 24px; }
        .stm-section-title {
          font-family: var(--ff-display);
          font-size: 20px; font-weight: 700;
          color: var(--ink); margin: 0;
          letter-spacing: -0.02em;
        }
        .stm-section-desc {
          font-family: var(--ff-mono);
          font-size: 9px; color: var(--mid);
          margin: 4px 0 0; text-transform: uppercase; letter-spacing: 0.1em;
        }

        /* ── Card group ──────────────────────────── */
        .stm-card-group {
          border: 1px solid var(--rule);
          margin-bottom: 32px;
        }

        /* ── Row ─────────────────────────────────── */
        .stm-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 20px;
          border-bottom: 1px solid var(--rule);
          transition: background 0.1s;
        }
        .stm-row:last-child { border-bottom: none; }
        .stm-row:hover { background: var(--accent-sub); }
        .stm-row-text { padding-right: 16px; min-width: 0; }
        .stm-row-label {
          display: block; font-family: var(--ff-mono);
          font-size: 10px; font-weight: 600; color: var(--ink);
          letter-spacing: 0.05em; text-transform: uppercase;
        }
        .stm-row-hint {
          display: block; font-family: var(--ff-mono); font-size: 9px;
          color: var(--mid); margin-top: 4px; line-height: 1.35;
        }
        .stm-row-ctrl { flex-shrink: 0; display: flex; align-items: center; }

        /* ── Toggle (Square Checkbox Style) ──────── */
        .stm-toggle {
          display: flex; align-items: center; gap: 8px;
          background: none; border: none; padding: 0;
          cursor: pointer; outline: none; color: var(--mid);
        }
        .stm-toggle.on { color: var(--ink); }
        .stm-toggle-box {
          width: 18px; height: 18px;
          border: 1px solid var(--rule);
          display: flex; align-items: center; justify-content: center;
          transition: background 0.1s, border-color 0.1s;
          color: var(--paper);
        }
        .stm-toggle:hover .stm-toggle-box { border-color: var(--mid); }
        .stm-toggle.on .stm-toggle-box {
          background: var(--ink); border-color: var(--ink);
        }

        /* ── Slider (Sharp Line) ─────────────────── */
        .stm-slider-wrap { display: flex; align-items: center; gap: 14px; }
        .stm-slider {
          -webkit-appearance: none; appearance: none;
          width: 140px; height: 1px; cursor: pointer;
          background: var(--rule); outline: none; position: relative;
        }
        .stm-slider::before {
          content: ''; position: absolute; left: 0; top: 0; bottom: 0;
          width: var(--slider-pct, 50%); background: var(--accent);
        }
        .stm-slider::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 12px; height: 12px;
          background: var(--accent);
          cursor: pointer; transition: transform 0.1s;
        }
        .stm-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }
        .stm-slider-val {
          font-family: var(--ff-mono); font-size: 10px; color: var(--ink);
          min-width: 42px; text-align: right;
        }

        /* ── Segment control (Square Borders) ────── */
        .stm-segment {
          display: inline-flex; border: 1px solid var(--rule);
        }
        .stm-segment-btn {
          padding: 6px 14px; border: none; border-right: 1px solid var(--rule);
          background: transparent; cursor: pointer; outline: none;
          font-family: var(--ff-mono); font-size: 9px; font-weight: 500;
          color: var(--mid); text-transform: uppercase; letter-spacing: 0.1em;
          transition: background 0.1s, color 0.1s;
        }
        .stm-segment-btn:last-child { border-right: none; }
        .stm-segment-btn.active { background: var(--ink); color: var(--paper); font-weight: 600; }
        .stm-segment-btn:hover:not(.active) { background: var(--accent-sub); color: var(--ink); }

        /* ── Theme cards (Sharp Grid) ────────────── */
        .stm-theme-group { margin-bottom: 24px; }
        .stm-theme-group:last-child { margin-bottom: 32px; }
        .stm-theme-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 12px;
        }
        .stm-theme-card {
          display: block; width: 100%; padding: 0; cursor: pointer; outline: none;
          border: 1px solid var(--tc-border); background: var(--tc-bg);
          transition: border-color 0.1s; text-align: left;
        }
        .stm-theme-card:hover { border-color: var(--tc-muted); }
        .stm-theme-card.selected {
          border-color: var(--tc-accent); box-shadow: 0 0 0 1px var(--tc-accent);
        }
        .stm-tc-preview {
          padding: 10px; background: var(--tc-bg-alt); border-bottom: 1px solid var(--tc-border);
        }
        .stm-tc-dots { display: flex; gap: 4px; margin-bottom: 10px; }
        .stm-tc-dot { width: 6px; height: 6px; }
        .stm-tc-lines { display: flex; flex-direction: column; gap: 4px; }
        .stm-tc-line { height: 2px; }
        .stm-tc-footer {
          padding: 8px 10px; display: flex; align-items: center; justify-content: space-between;
        }
        .stm-tc-name { font-size: 9px; color: var(--tc-text); }
        .stm-tc-check {
          width: 14px; height: 14px; display: flex; align-items: center; justify-content: center;
          background: var(--tc-accent); color: var(--tc-bg);
        }

        /* ── Accent swatches ─────────────────────── */
        .stm-accent-grid { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-bottom: 32px; }
        .stm-accent-swatch {
          width: 24px; height: 24px;
          border: 1px solid var(--rule); cursor: pointer; outline: none;
          background: var(--swatch);
          display: flex; align-items: center; justify-content: center; color: #fff;
          transition: border-color 0.1s;
        }
        .stm-accent-swatch:hover { border-color: var(--ink); }
        .stm-accent-swatch.selected { border-color: var(--ink); box-shadow: 0 0 0 2px var(--ink); }
        .stm-custom-color { display: flex; align-items: center; gap: 8px; cursor: pointer; }
        .stm-color-input { width: 24px; height: 24px; border: 1px solid var(--rule); cursor: pointer; padding: 0; }

        /* ── Font pills ──────────────────────────── */
        .stm-font-pills { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 32px; }
        .stm-font-pills .db-ghost.active { background: var(--ink); color: var(--paper); border-color: var(--ink); }

        /* ── Editor font grid ────────────────────── */
        .stm-editor-font-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px;
          margin-bottom: 32px;
        }
        .stm-editor-font-card {
          padding: 12px 14px; border: 1px solid var(--rule); text-align: left;
          cursor: pointer; outline: none; background: transparent; color: var(--mid);
          transition: border-color 0.1s, color 0.1s;
        }
        .stm-editor-font-card.active { border-color: var(--accent); color: var(--ink); background: var(--accent-sub); }
        .stm-editor-font-card:hover:not(.active) { border-color: var(--ink); color: var(--ink); }
        .stm-efc-sample { font-size: 16px; margin-bottom: 8px; color: var(--ink); }
        .stm-efc-meta { display: flex; align-items: center; gap: 8px; }

        /* ── Shortcut rows ───────────────────────── */
        .stm-shortcut-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 20px; border-bottom: 1px solid var(--rule);
        }
        .stm-shortcut-row:last-child { border-bottom: none; }
        .stm-shortcut-keys { display: flex; gap: 6px; }

        /* ── Reset card ──────────────────────────── */
        .stm-reset-card {
          margin-top: 32px; padding: 20px;
          border: 1px solid var(--rule);
          display: flex; align-items: flex-start; gap: 16px;
        }
        .stm-reset-icon { color: var(--mid); }
        .stm-reset-text { flex: 1; }
        .stm-reset-text p {
          font-family: var(--ff-mono); font-size: 10px; color: var(--mid);
          margin: 6px 0 0; line-height: 1.5; text-transform: uppercase;
        }

        /* ── Mobile responsive ───────────────────── */
        @media (max-width: 640px) {
          .stm-modal {
            width: 100vw; height: 100dvh; max-width: 100vw; max-height: 100dvh;
            border: none; border-top: 3px solid var(--accent); box-shadow: none;
          }
          .stm-body { flex-direction: column; }
          .stm-nav { display: none; /* Can implement mobile nav scroll if needed, hiding for purity */ }
          .stm-content { padding: 20px 24px; }
          .stm-theme-grid { grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); }
          .stm-reset-card { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
