'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, BellRing, ChevronRight } from 'lucide-react';
import { requestPushSubscription } from '@/lib/usePushSubscription';

export interface Notif {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

interface NotifPanelProps {
  notifs: Notif[];
  onMarkAllRead: () => void;
  onClose: () => void;
}

export default function NotifPanel({ notifs, onMarkAllRead, onClose }: NotifPanelProps) {
  const unread = notifs.filter(n => !n.read).length;

  // ── FIX 2: track push permission state ──
  const [pushState, setPushState] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('unsupported');
  const [enabling, setEnabling] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) { setPushState('unsupported'); return; }
    setPushState(Notification.permission as 'granted' | 'denied' | 'default');
  }, []);

  const handleEnablePush = async () => {
    setEnabling(true);
    const ok = await requestPushSubscription();
    setPushState(ok ? 'granted' : (Notification.permission as any));
    setEnabling(false);
  };

  return (
    // Note: width/positioning is now handled by the portal wrapper in Header.tsx
    <div className="db-notif-panel db-rise-0" style={{ width: 300 }}>

      {/* Masthead row */}
      <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={11} strokeWidth={1.8} style={{ color: 'var(--mid)' }} />
          <span style={{ fontFamily: 'var(--ff-ui)', fontSize: 9, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink)' }}>
            Notifications
          </span>
          {unread > 0 && (
            <span style={{ fontFamily: 'var(--ff-ui)', fontSize: 8, fontWeight: 700, background: 'var(--accent)', color: 'var(--paper)', padding: '1px 5px', letterSpacing: '0.08em' }}>
              {unread}
            </span>
          )}
        </div>
        {unread > 0 && (
          <button className="db-ghost" onClick={onMarkAllRead} style={{ padding: '2px 7px', fontSize: 8 }}>
            <BellOff size={9} strokeWidth={1.8} /> Mark read
          </button>
        )}
      </div>

      {/* ── FIX 2: Push notification enable banner ── */}
      {pushState !== 'granted' && pushState !== 'unsupported' && pushState !== 'denied' && (
        <div style={{
          padding: '8px 14px',
          borderBottom: '1px solid var(--rule)',
          background: 'var(--accent-sub)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <BellRing size={11} strokeWidth={1.8} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--ff-ui)', fontSize: 9, color: 'var(--mid)', flex: 1 }}>
            Enable push notifications to get alerts
          </span>
          <button
            className="db-ghost"
            onClick={handleEnablePush}
            disabled={enabling}
            style={{ padding: '2px 7px', fontSize: 8, flexShrink: 0, opacity: enabling ? 0.6 : 1 }}
          >
            {enabling ? 'Enabling…' : 'Enable'}
          </button>
        </div>
      )}

      {/* Denied notice */}
      {pushState === 'denied' && (
        <div style={{
          padding: '8px 14px',
          borderBottom: '1px solid var(--rule)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <BellOff size={11} strokeWidth={1.8} style={{ color: 'var(--mid)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--ff-ui)', fontSize: 9, color: 'var(--mid)' }}>
            Push blocked. Enable in browser site settings.
          </span>
        </div>
      )}

      {/* Items */}
      <div style={{ maxHeight: 270, overflowY: 'auto' }}>
        {notifs.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--mid)', fontSize: 9, fontFamily: 'var(--ff-mono)', letterSpacing: '0.05em' }}>
            NO NOTIFICATIONS
          </div>
        ) : (
          notifs.map(n => (
            <div key={n.id} style={{
              padding: '9px 14px',
              borderBottom: '1px solid var(--rule)',
              borderLeft: !n.read ? '2px solid var(--accent)' : '2px solid transparent',
              background: !n.read ? 'var(--accent-sub)' : 'transparent',
            }}>
              <div style={{ fontFamily: 'var(--ff-ui)', fontSize: 10.5, fontWeight: 500, color: 'var(--ink)', marginBottom: 2, letterSpacing: '0.02em' }}>{n.title}</div>
              <div style={{ fontFamily: 'var(--ff-ui)', fontSize: 9.5, color: 'var(--mid)', lineHeight: 1.5, marginBottom: 4 }}>{n.body}</div>
              <span className="db-cap">{n.time}</span>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '7px 14px', borderTop: '1px solid var(--rule)' }}>
        <button className="db-ghost" onClick={onClose} style={{ padding: '2px 7px', fontSize: 8 }}>
          Close <ChevronRight size={9} />
        </button>
      </div>
    </div>
  );
}