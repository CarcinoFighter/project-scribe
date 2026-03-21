'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, X } from 'lucide-react';

interface ToastProps {
  message: string;
  onDismiss: () => void;
}

export default function Toast({ message, onDismiss }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3200);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return createPortal(
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 99999,
      background: 'var(--surface-2)', border: '1px solid var(--border-med)',
      borderRadius: 'var(--r-lg)', padding: '10px 14px',
      boxShadow: 'var(--sh-md)', display: 'flex', alignItems: 'center', gap: 10,
      animation: 'fadeIn 0.18s ease', fontFamily: 'inherit',
    }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--accent-subtle2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Check size={10} style={{ color: 'var(--accent)' }} strokeWidth={2.5} />
      </div>
      <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{message}</span>
      <button className="tb-btn" onClick={onDismiss} style={{ padding: '2px 3px', borderRadius: 4, marginLeft: 2 }}>
        <X size={12} />
      </button>
    </div>,
    document.body
  );
}
