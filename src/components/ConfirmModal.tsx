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
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={onCancel}
    >
      <div
        className="scale-in"
        style={{
          background: 'var(--paper)',
          border: '1px solid var(--rule)',
          borderTop: '2px solid var(--accent)',
          padding: '28px 30px 24px',
          width: 340,
          maxWidth: 'calc(100vw - 32px)',
          boxShadow: '20px 20px 0px rgba(0,0,0,0.3)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 className="db-display" style={{ fontSize: 18, margin: '0 0 12px' }}>
          {title}
        </h3>
        <p style={{ fontFamily: 'var(--ff-ui)', fontSize: 13, color: 'var(--mid)', lineHeight: 1.6, margin: '0 0 28px' }}>
          {message}
        </p>
        <div className="flex gap-2 justify-end">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="db-ghost"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="db-btn"
            style={{
              background: danger ? '#b03030' : 'var(--ink)',
            }}
          >
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
