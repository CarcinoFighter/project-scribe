'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  danger       = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus cancel by default (safer default)
  useEffect(() => { cancelRef.current?.focus(); }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter')  { e.preventDefault(); onConfirm(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onConfirm, onCancel]);

  const content = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(10,6,20,0.50)', backdropFilter: 'blur(6px)' }}
      onClick={onCancel}
    >
      <div
        className="glass-overlay scale-in"
        style={{ borderRadius: 20, padding: '28px 30px 24px', width: 340, maxWidth: 'calc(100vw - 32px)' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          {title}
        </h3>
        <p style={{ fontSize: 13.5, color: 'var(--text-3)', lineHeight: 1.6, margin: '0 0 22px' }}>
          {message}
        </p>
        <div className="flex gap-2 justify-end">
          <button
            ref={cancelRef}
            onClick={onCancel}
            style={{
              padding: '8px 18px', borderRadius: 10,
              border: '1px solid var(--border-strong)',
              background: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13.5,
              color: 'var(--text-3)',
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 18px', borderRadius: 10, border: 'none',
              cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 13.5, fontWeight: 600,
              background: danger ? '#dc2626' : 'var(--accent)',
              color: '#fff',
              boxShadow: danger ? '0 2px 10px rgba(220,38,38,0.3)' : '0 2px 10px var(--accent-glow)',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
