'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { User, Settings, Edit3, LogOut, Sun, Moon } from 'lucide-react';
import Image from 'next/image';

interface AccountMenuProps {
  user: any;
  onClose: () => void;
  onToast: (m: string) => void;
  onOpenSettings?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export default function AccountMenu({ user, onClose, onToast, onOpenSettings, isDark, onToggleTheme }: AccountMenuProps) {
  const router = useRouter();

  const items = [
    { icon: User,     label: 'Profile',     action: () => { onClose(); router.push('/profile'); } },
    { icon: Settings, label: 'Settings',    action: () => { onClose(); onOpenSettings?.(); } },
    { icon: isDark ? Sun : Moon, label: `Switch to ${isDark ? 'Light' : 'Dark'}`, action: () => { onClose(); onToggleTheme?.(); } },
    { icon: Edit3,    label: 'Open Editor', action: () => { onClose(); router.push('/editor'); } },
  ];

  const handleLogout = async () => {
    onClose();
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
    onToast('Signed out');
  };

  return (
    <div
      className="anim-slide-down db-ctx-menu"
      style={{ minWidth: 190, width: 'max-content', maxWidth: 240, zIndex: 200 }}
    >
      {/* ── User identity strip ── */}
      <div style={{ padding: '13px 14px', borderBottom: '1px solid var(--rule)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Avatar — square per design system */}
          <div style={{
            width: 32, height: 32,
            overflow: 'hidden',
            border: '1px solid var(--rule)',
            flexShrink: 0,
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {user?.avatar_url ? (
              <Image src={user.avatar_url} alt="Profile" width={32} height={32} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
            ) : (
              <span style={{ fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 11, color: 'var(--paper)', letterSpacing: '0.04em' }}>
                {user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'S'}
              </span>
            )}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontFamily: 'var(--ff-display)', fontSize: 12, fontWeight: 700,
              color: 'var(--ink)', whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3,
            }}>
              {user?.name || 'User'}
            </div>
            <div style={{
              fontFamily: 'var(--ff-mono)', fontSize: 9, letterSpacing: '0.05em',
              color: 'var(--mid)', whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2,
            }}>
              {user?.email || ''}
            </div>
          </div>
        </div>
      </div>

      {/* ── Menu items ── */}
      {items.map(item => (
        <button
          key={item.label}
          className="db-ctx-item"
          style={{ width: '100%', textAlign: 'left' }}
          onClick={item.action}
        >
          <item.icon size={11} strokeWidth={1.8} />
          {item.label}
        </button>
      ))}

      {/* ── Sign out ── */}
      <button
        className="db-ctx-item danger"
        style={{ width: '100%', textAlign: 'left', borderTop: '1px solid var(--rule)' }}
        onClick={handleLogout}
      >
        <LogOut size={11} strokeWidth={1.8} />
        Sign out
      </button>
    </div>
  );
}