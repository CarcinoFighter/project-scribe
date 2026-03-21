'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  body: string;
  targetId?: string;
  emoji: string;
}

const STEPS: Step[] = [
  {
    id: 'welcome',
    title: 'Welcome to Carcino Scribe',
    body: 'A beautiful, distraction-free markdown editor made for writers, bloggers, and researchers. This quick tour will show you everything in under a minute.',
    emoji: '✦',
  },
  {
    id: 'view-modes',
    title: 'View Modes',
    body: 'Switch between Editor-only, Split view (editor + live preview side-by-side), and Preview-only using the three icons in the top-right of the header.',
    targetId: 'tour-view-modes',
    emoji: '⊞',
  },
  {
    id: 'toolbar',
    title: 'Formatting Toolbar',
    body: 'Click any button to format selected text — or with nothing selected, formatting is inserted at the cursor. All standard Markdown shortcuts like Ctrl+B and Ctrl+I also work.',
    targetId: 'tour-toolbar',
    emoji: '✎',
  },
  {
    id: 'outline',
    title: 'Document Outline',
    body: 'The left sidebar auto-tracks every heading in your document. Click any heading to jump straight to it in the editor and preview.',
    targetId: 'tour-sidebar',
    emoji: '≡',
  },
  {
    id: 'statusbar',
    title: 'Status Bar',
    body: 'Live word count, character count, estimated reading time, and cursor position. Auto-save runs every 800ms and stores your work in the browser.',
    targetId: 'tour-statusbar',
    emoji: '◈',
  },
  {
    id: 'wordgoal',
    title: 'Word Goal',
    body: 'Click the word count in the status bar to set a writing goal. A subtle progress ring tracks your progress — perfect for blog posts or article targets.',
    targetId: 'tour-statusbar',
    emoji: '◎',
  },
  {
    id: 'zenmode',
    title: 'Zen & Focus Modes',
    body: 'Press Ctrl+Shift+Z for Zen mode (hides the chrome, hover to reveal). Press Ctrl+Shift+F for Focus mode (dims all lines except the one you\'re writing).',
    emoji: '◯',
  },
  {
    id: 'cmdpalette',
    title: 'Command Palette',
    body: 'Press Ctrl+K to open the command palette. Search and run any action — insert templates, toggle modes, export, and more — all from your keyboard.',
    emoji: '>_',
  },
  {
    id: 'export',
    title: 'Export',
    body: 'Use the download button to export your document as a .md file or a styled .html file ready to publish. Open local markdown files with the folder icon.',
    targetId: 'tour-export',
    emoji: '↓',
  },
];

interface TourProps {
  onClose: () => void;
}

export default function GuidedTour({ onClose }: TourProps) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const current = STEPS[step];

  const measureTarget = useCallback(() => {
    if (!current.targetId) { setRect(null); return; }
    const el = document.getElementById(current.targetId);
    if (el) setRect(el.getBoundingClientRect());
    else setRect(null);
  }, [current.targetId]);

  useEffect(() => {
    measureTarget();
    window.addEventListener('resize', measureTarget);
    return () => window.removeEventListener('resize', measureTarget);
  }, [measureTarget]);

  const next = () => { if (step < STEPS.length - 1) setStep(s => s + 1); else onClose(); };
  const prev = () => { if (step > 0) setStep(s => s - 1); };

  const PAD = 6;

  const content = (
    <>
      {/* Dim backdrop */}
      <div
        className="fixed inset-0 z-[9990]"
        style={{ background: 'rgba(10,6,20,0.55)', backdropFilter: 'blur(2px)' }}
      />

      {/* Spotlight ring around target element */}
      {rect && (
        <div
          className="tour-spotlight fixed z-[9998]"
          style={{
            top:    rect.top    - PAD,
            left:   rect.left   - PAD,
            width:  rect.width  + PAD * 2,
            height: rect.height + PAD * 2,
          }}
        />
      )}

      {/* Tour card */}
      <div
        className="fixed z-[9999] glass-overlay scale-in"
        style={{
          borderRadius: 20,
          width: 380,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '28px 28px 28px',
        }}
      >
        {/* Step emoji + counter */}
        <div className="flex items-center justify-between mb-4">
          <div
            className="flex items-center justify-center text-xl font-bold"
            style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'var(--accent-subtle2)',
              color: 'var(--accent)',
            }}
          >
            {current.emoji}
          </div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 12, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
              {step + 1} / {STEPS.length}
            </span>
            <button
              onClick={onClose}
              className="tb-btn"
              style={{ padding: '4px', borderRadius: 8 }}
              title="Skip tour"
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5 mb-4">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              style={{
                height: 3,
                flex: i === step ? 3 : 1,
                borderRadius: 2,
                background: i === step ? 'var(--accent)' : i < step ? 'var(--accent-xlight)' : 'var(--border-strong)',
                border: 'none',
                cursor: 'pointer',
                transition: 'flex 0.3s, background 0.2s',
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="fade-in" key={step}>
          <h3
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: 'var(--text)',
              marginBottom: 8,
              letterSpacing: '-0.02em',
            }}
          >
            {current.title}
          </h3>
          <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>
            {current.body}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={onClose}
            style={{
              fontSize: 12.5,
              color: 'var(--text-3)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              padding: '6px 4px',
            }}
          >
            Skip tour
          </button>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={prev}
                className="tb-btn"
                style={{ padding: '7px 12px', borderRadius: 10, border: '1px solid var(--border-strong)' }}
              >
                <ArrowLeft size={14} strokeWidth={2} />
              </button>
            )}
            <button
              onClick={next}
              className="flex items-center gap-2"
              style={{
                padding: '8px 18px',
                borderRadius: 12,
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: 600,
                fontSize: 13.5,
                boxShadow: '0 2px 12px var(--accent-glow)',
                transition: 'background 0.13s, box-shadow 0.13s',
              }}
            >
              {step === STEPS.length - 1 ? (
                <><Sparkles size={14} /> Get writing</>
              ) : (
                <>Next <ArrowRight size={14} /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}
