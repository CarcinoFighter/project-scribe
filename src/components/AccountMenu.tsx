'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { User, Settings, LayoutGrid, Edit3, LogOut } from 'lucide-react';
import Image from 'next/image';

interface AccountMenuProps {
  user: any;
  onClose: () => void;
  onToast: (m: string) => void;
  onOpenSettings?: () => void;
}

export default function AccountMenu({ user, onClose, onToast, onOpenSettings }: AccountMenuProps) {
  const router = useRouter();
  const items = [
    { icon: User,       label: 'Profile',      active: false, action: () => { onClose(); onToast('Profile settings coming soon'); } },
    { icon: Settings,   label: 'Settings',     active: false, action: () => { onClose(); onOpenSettings?.(); } },
    { icon: LayoutGrid, label: 'Dashboard',    active: false, action: () => { onClose(); router.push('/'); } },
    { icon: Edit3,      label: 'Open Editor',  active: false, action: () => { onClose(); router.push('/editor'); } },
  ];

  const handleLogout = async () => {
    onClose();
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
    onToast('Signed out');
  };

  return (
    <div className="glass-overlay anim-drop-in" style={{ borderRadius: 'var(--r-lg)', minWidth: 210, overflow: 'hidden', zIndex: 200 }}>
      <div style={{ padding: '144x 16px', borderBottom: '1px solid var(--border)' }} className="p-4">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user?.avatar_url ? (
            <div style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden' }}>
              <Image src={user.avatar_url} alt="Profile" width={34} height={34} />
            </div>
          ) : (
            <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>
              {user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'S'}
            </div>
          )}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{user?.name || 'User'}</div>
            <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{user?.email || ''}</div>
          </div>
        </div>
      </div>
      {items.map(item => (
        <button key={item.label} className="tb-btn" style={{ width: '100%', justifyContent: 'flex-start', padding: '9px 16px', borderRadius: 0, gap: 10, color: item.active ? 'var(--accent)' : 'var(--text-3)', background: item.active ? 'var(--accent-subtle)' : 'transparent' }} onClick={item.action}>
          <item.icon size={14} strokeWidth={1.8} />
          <span style={{ fontSize: 13 }}>{item.label}</span>
        </button>
      ))}
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <button className="tb-btn" style={{ width: '100%', justifyContent: 'flex-start', padding: '9px 16px', borderRadius: 0, gap: 10, color: '#ef4444' }} onClick={handleLogout}>
          <LogOut size={14} strokeWidth={1.8} />
          <span style={{ fontSize: 13 }}>Sign out</span>
        </button>
      </div>
    </div>
  );
}
