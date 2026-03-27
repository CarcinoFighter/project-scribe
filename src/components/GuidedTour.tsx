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

const DESKTOP_STEPS: Step[] = [
  { id: 'welcome', title: 'Welcome to Carcino Vantage', body: 'A beautiful, distraction-free markdown editor made for writers, bloggers, and researchers.', emoji: '✦' },
  { id: 'view-modes', title: 'View Modes', body: 'Switch between Editor-only, Split view, and Preview-only using the icons in the header.', targetId: 'tour-view-modes', emoji: '⊞' },
  { id: 'toolbar', title: 'Formatting Toolbar', body: 'Click any button to format text. Standard Markdown shortcuts like Ctrl+B also work.', targetId: 'tour-toolbar', emoji: '✎' },
  { id: 'outline', title: 'Document Outline', body: 'The left sidebar tracks every heading. Click to jump to it in the editor.', targetId: 'tour-sidebar', emoji: '≡' },
  { id: 'statusbar', title: 'Status Bar', body: 'Live word count, reading time, and cursor position. Auto-save runs every 800ms.', targetId: 'tour-statusbar', emoji: '◈' },
  { id: 'cmdpalette', title: 'Command Palette', body: 'Press Ctrl+K to search and run any action from your keyboard.', emoji: '>' },
  { id: 'export', title: 'Export', body: 'Export as Markdown or styled HTML ready to publish.', targetId: 'tour-export', emoji: '↓' },
];

const MOBILE_STEPS: Step[] = [
  { id: 'welcome', title: 'Welcome', body: 'A beautiful markdown editor for mobile writers.', emoji: '✦' },
  { id: 'toolbar', title: 'Toolbar', body: 'Formatting tools are docked at the bottom. Swipe horizontally to see more.', emoji: '✎' },
  { id: 'view', title: 'Editor / Preview', body: 'Use the floating button to switch between editing and preview.', emoji: '⊞' },
  { id: 'outline', title: 'Outline', body: 'Tap the menu and select "Outline" to see document headings.', emoji: '≡' },
  { id: 'cmdpalette', title: 'Commands', body: 'Tap the search icon for quick access to all commands.', emoji: '>' },
];

interface TourProps {
  onClose: () => void;
  isMobile?: boolean;
}

export default function GuidedTour({ onClose, isMobile }: TourProps) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const currentSteps = isMobile ? MOBILE_STEPS : DESKTOP_STEPS;
  const current = currentSteps[step];

  const measureTarget = useCallback(() => {
    if (!current.targetId || isMobile) { setRect(null); return; }
    const el = document.getElementById(current.targetId);
    if (el) setRect(el.getBoundingClientRect());
    else setRect(null);
  }, [current.targetId, isMobile]);

  useEffect(() => {
    measureTarget();
    window.addEventListener('resize', measureTarget);
    return () => window.removeEventListener('resize', measureTarget);
  }, [measureTarget]);

  const next = () => { if (step < currentSteps.length - 1) setStep(s => s + 1); else onClose(); };
  const prev = () => { if (step > 0) setStep(s => s - 1); };

  const PAD = 6;

  const content = (
    <>
      {!isMobile && (
        <svg className="fixed inset-0 z-[9990]" style={{ pointerEvents: 'none', width: '100%', height: '100%' }}>
          <defs>
            <mask id="tour-mask">
              <rect width="100%" height="100%" fill="white" />
              {rect && (
                <rect
                  x={rect.left - PAD}
                  y={rect.top - PAD}
                  width={rect.width + PAD * 2}
                  height={rect.height + PAD * 2}
                  fill="black"
                  className="transition-all duration-500"
                />
              )}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(10,6,20,0.60)" mask="url(#tour-mask)" />
        </svg>
      )}

      {rect && !isMobile && (
        <div
          className="fixed z-[9998] border-2 border-[var(--accent)] pointer-events-none transition-all duration-500"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
          }}
        />
      )}

      <div 
        className="fixed z-[9999] db-modal db-rise-0" 
        style={{ 
          width: isMobile ? 'calc(100vw - 32px)' : '380px',
          maxWidth: '90vw',
          top: isMobile ? '50%' : (rect ? Math.min(rect.bottom + 20, window.innerHeight - 300) : '50%'),
          left: isMobile ? '50%' : (rect ? Math.min(rect.left, window.innerWidth - 400) : '50%'),
          transform: isMobile ? 'translate(-50%, -50%)' : (rect ? 'none' : 'translate(-50%, -50%)'),
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 flex items-center justify-center text-xl font-bold bg-[var(--accent-sub)] text-[var(--accent)]">
            {current.emoji}
          </div>
          <div className="flex items-center gap-2">
            <span className="db-cap">
              {step + 1} / {currentSteps.length}
            </span>
            <button onClick={onClose} className="db-icon-btn" style={{ width: '28px', height: '28px' }}>
              <X size={14} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="flex gap-1.5 mb-4">
          {currentSteps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1 flex-1 transition-all ${i === step ? 'bg-[var(--accent)]' : i < step ? 'bg-[var(--accent-dim)]' : 'bg-[var(--rule)]'}`}
            />
          ))}
        </div>

        <div className="db-rise-0" key={step}>
          <h3 className="db-page-title" style={{ fontSize: '17px', marginBottom: '8px' }}>
            {current.title}
          </h3>
          <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--mid)' }}>
            {current.body}
          </p>
        </div>

        <div className="flex items-center justify-between mt-6">
          <button onClick={onClose} className="db-ghost" style={{ padding: '4px 8px', fontSize: '12px' }}>
            Skip tour
          </button>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button onClick={prev} className="db-ghost">
                <ArrowLeft size={14} strokeWidth={2} />
              </button>
            )}
            <button onClick={next} className="db-btn">
              {step === currentSteps.length - 1 ? (
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