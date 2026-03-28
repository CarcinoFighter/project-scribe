'use client';

import React from 'react';
import { Bell, BellOff, ChevronRight } from 'lucide-react';

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

  return (
    <div className="db-notif-panel db-rise-0">
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
