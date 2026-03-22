'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, X } from 'lucide-react';

interface ToastProps {
  message: string;
  onDismiss: () => void;
}

export default function Toast({ message, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance
    const enter = requestAnimationFrame(() => setVisible(true));
    // Auto-dismiss after 3s
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 260); // wait for exit animation
    }, 3000);
    return () => { cancelAnimationFrame(enter); clearTimeout(timer); };
  }, [onDismiss]);

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 99999,
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'var(--surface-2)',
        backdropFilter: 'blur(20px) saturate(170%)',
        WebkitBackdropFilter: 'blur(20px) saturate(170%)',
        border: '1px solid var(--border-med)',
        borderRadius: 'var(--r-lg)',
        padding: '10px 12px 10px 14px',
        boxShadow: 'var(--sh-md)',
        fontFamily: 'inherit',
        maxWidth: 320,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.97)',
        transition: 'opacity 0.24s ease, transform 0.24s cubic-bezier(0.22,1,0.36,1)',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%',
        background: 'var(--accent-subtle2)', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Check size={10} style={{ color: 'var(--accent)' }} strokeWidth={2.5} />
      </div>
      <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, flex: 1, lineHeight: 1.4 }}>
        {message}
      </span>
      <button
        onClick={() => { setVisible(false); setTimeout(onDismiss, 260); }}
        aria-label="Dismiss"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '2px 3px', borderRadius: 4,
          color: 'var(--text-4)', display: 'flex', alignItems: 'center',
          transition: 'color 0.10s',
        }}
        onMouseOver={e => (e.currentTarget.style.color = 'var(--text)')}
        onMouseOut={e  => (e.currentTarget.style.color = 'var(--text-4)')}
      >
        <X size={12} />
      </button>
    </div>,
    document.body
  );
}
