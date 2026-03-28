'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User, Mail, Briefcase, Shield, Camera,
  Save, ArrowLeft, Loader2, CheckCircle2, AlertCircle,
  Moon, Sun,
} from 'lucide-react';
import { useUser } from '@/lib/useUser';
import { useTheme } from '@/lib/useTheme';
import ImageCropModal from '@/components/ImageCropModal';
import SettingsModal, {
  loadSettings,
  saveSettings,
  applySettings,
  type AppSettings,
} from '@/components/SettingsModal';
import { Settings } from 'lucide-react';

/* ── Logo ─────────────────────────────────────────────────── */
function Logo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 1.2)} viewBox="0 0 20 24" fill="none" aria-hidden>
      <path d="M9.13307 5.97435C9.21934 5.23291 9.33279 4.80925 9.89802 4.0092C10.9029 2.80263 11.6709 2.67501 12.9912 2.4556L13.0042 2.45344C14.8586 2.34816 15.7395 3.26056 16.1799 4.26653C16.6203 5.27251 16.5553 7.03881 16.4233 7.9863C16.2913 8.93378 15.7627 11.4166 12.7608 13.8614C13.5837 14.1538 13.6573 14.1074 14.65 14.2561C15.6004 13.2384 16.1436 12.4864 17.5128 10.8405C18.882 9.19453 19.661 6.91014 19.8772 5.50646C20.0934 4.10278 20.1438 2.45344 18.9963 1.26031C17.8489 0.0671784 15.5888 -0.131673 14.198 0.067179C12.8072 0.266031 10.3732 1.26031 8.68105 2.6289C6.98888 3.9975 6.20076 5.50646 5.57488 7.5418C4.949 9.57714 5.30938 11.2467 6.08485 13.332C7.40174 16.0707 9.01717 17.9291 10.4196 18.8415C11.822 19.7539 12.8072 20.2451 14.3487 22.842C16.2495 19.8123 16.9991 18.6706 18.4632 16.9465C17.5128 15.7767 16.2842 15.1142 13.8735 14.7825C11.4627 14.4508 10.6865 13.6665 10.2341 13.6478C9.78183 13.6291 9.26057 13.6244 9.09831 13.5776C8.93605 13.5309 8.89093 13.5242 8.76218 13.2384C8.62326 12.7331 8.76218 11.9985 8.76218 11.8932C8.76218 11.7879 8.54197 11.6476 8.54197 11.5072C8.54197 11.3668 8.61607 11.2835 8.77377 11.2031C8.77377 11.2031 8.41448 11.0042 8.41448 10.8405C8.41448 10.6767 8.57673 10.0567 8.54197 9.91637C8.50721 9.776 7.68429 9.60054 7.83497 9.3198C7.98565 9.03906 9.16153 7.60314 9.30692 7.30785C9.45232 7.01256 9.15359 6.6787 9.13307 5.97435Z" fill="currentColor"/>
      <path d="M8.00883 18.0928C5.32942 19.6789 3.54237 20.5984 1.2981 21.2277L0 24C1.2981 23.9064 5.74874 21.7424 9.23739 19.169L8.00883 18.0928Z" fill="currentColor"/>
    </svg>
  );
}

/* ── Field row ───────────────────────────────────────────── */
function FieldRow({
  label, icon: Icon, children, note,
}: {
  label: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  note?: string;
}) {
  return (
    <div style={{ borderBottom: '1px solid var(--rule)', padding: '18px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        {Icon && <Icon size={10} strokeWidth={1.8} style={{ color: 'var(--mid)' }} />}
        <span className="db-cap">{label}</span>
      </div>
      {children}
      {note && (
        <p style={{ fontFamily: 'var(--ff-mono)', fontSize: 9, color: 'var(--mid)', marginTop: 6, letterSpacing: '0.04em' }}>
          {note}
        </p>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading: userLoading, refreshUser } = useUser();
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();

  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  // Apply saved settings on mount
  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    applySettings(s);
  }, []);

  useEffect(() => {
    if (user) { setName(user.name || ''); setAvatarUrl(user.avatar_url || ''); }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMessage(null);
    try {
      const res = await fetch('/api/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatar_url: avatarUrl }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
        await refreshUser();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be under 2 MB' });
      return;
    }
    setUploading(true); setMessage(null);
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setTempImage(reader.result as string);
      setShowCropModal(true);
      setUploading(false);
    });
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (blob: Blob) => {
    setShowCropModal(false); setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', blob, 'avatar.jpg');
      const res = await fetch('/api/users/upload-avatar', { method: 'POST', body: formData });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Upload failed'); }
      const data = await res.json();
      setAvatarUrl(data.url);
      setMessage({ type: 'success', text: 'Avatar uploaded — click Save to apply.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error uploading image' });
    } finally {
      setUploading(false); setTempImage(null);
    }
  };

  if (userLoading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)' }}>
        <Loader2 size={28} style={{ color: 'var(--accent)', animation: 'db-spin 0.8s linear infinite' }} />
      </div>
    );
  }
  if (!user) { router.push('/login'); return null; }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--paper)', color: 'var(--ink)', display: 'flex', flexDirection: 'column' }}>

      {/* ══ HEADER ═══════════════════════════════════════════════ */}
      <header className="db-header">
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink)', textDecoration: 'none', flexShrink: 0 }}>
          <Logo size={14} />
          <span style={{ fontFamily: 'var(--ff-display)', fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
            Carcino<span className="hidden sm:inline"> Vantage</span>
          </span>
        </Link>
        <span style={{ color: 'var(--rule)', fontSize: 14, fontFamily: 'var(--ff-mono)', margin: '0 8px' }}>/</span>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--mid)' }}>Profile</span>

        <div style={{ flex: 1 }} />

        <button className="db-icon-btn" onClick={toggleTheme} title={isDark ? 'Light' : 'Dark'}>
          {isDark ? <Sun size={13} strokeWidth={1.8} /> : <Moon size={13} strokeWidth={1.8} />}
        </button>
        <button className="db-icon-btn" onClick={() => setShowSettings(true)} title="Settings">
          <Settings size={13} strokeWidth={1.8} />
        </button>
        <div className="db-vr" />
        <Link href="/" className="db-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <ArrowLeft size={10} strokeWidth={1.8} />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>
      </header>

      {/* ══ BODY ══════════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex' }}>

        {/* ── SIDEBAR ──────────────────────────────────────────── */}
        <aside className="db-sidebar">
          <div className="db-sidebar-label">Your Profile</div>

          {/* Mini avatar card */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--rule)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, overflow: 'hidden', border: '1px solid var(--rule)', position: 'relative', flexShrink: 0 }}>
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Avatar" width={36} height={36} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 13, color: 'var(--paper)' }}>
                    {user.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'U'}
                  </div>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--ff-display)', fontSize: 12, fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 8.5, color: 'var(--mid)', letterSpacing: '0.08em', marginTop: 1 }}>{user.department || 'Member'}</div>
              </div>
            </div>
          </div>

          <div className="db-sidebar-rule" />
          <div className="db-sidebar-label">Account Info</div>

          {[
            { label: 'Role', value: user.admin_access ? 'Administrator' : 'Editor' },
            { label: 'Status', value: 'Active' },
            { label: 'Dept', value: user.department || '—' },
          ].map(item => (
            <div key={item.label} style={{ padding: '7px 20px', borderTop: '1px solid var(--rule)' }}>
              <div className="db-cap" style={{ marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--ink)', letterSpacing: '0.03em' }}>{item.value}</div>
            </div>
          ))}

          {user.admin_access && (
            <div style={{ margin: '12px 16px', padding: '8px 12px', background: 'var(--accent-sub)', border: '1px solid var(--rule)', borderLeft: '2px solid var(--accent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Shield size={10} style={{ color: 'var(--accent)' }} />
                <span className="db-cap" style={{ color: 'var(--accent)' }}>Admin Access</span>
              </div>
            </div>
          )}
        </aside>

        {/* ── MAIN ─────────────────────────────────────────────── */}
        <main className="db-main" style={{ maxWidth: 720 }}>

          {/* Page heading */}
          <div className="db-rise-0" style={{ marginBottom: 6 }}>
            <h1 className="db-page-title">Profile<em>.</em></h1>
            <p className="db-page-sub" style={{ marginTop: 6 }}>Manage your account settings</p>
          </div>
          <hr className="db-triple-rule" />

          {/* Status message */}
          {message && (
            <div style={{
              marginBottom: 20,
              padding: '10px 14px',
              borderLeft: `3px solid ${message.type === 'success' ? '#3e9a5e' : '#b03030'}`,
              background: message.type === 'success' ? 'rgba(62,154,94,0.06)' : 'rgba(176,48,48,0.06)',
              fontFamily: 'var(--ff-mono)',
              fontSize: 11,
              color: message.type === 'success' ? '#3e9a5e' : '#b03030',
              letterSpacing: '0.03em',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              {message.type === 'success' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
              {message.text}
            </div>
          )}

          <form onSubmit={handleSave} noValidate>

            {/* Avatar */}
            <div style={{ borderBottom: '1px solid var(--rule)', padding: '20px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                <Camera size={10} strokeWidth={1.8} style={{ color: 'var(--mid)' }} />
                <span className="db-cap">Profile Photo</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
                {/* Avatar preview */}
                <div
                  style={{ position: 'relative', width: 60, height: 60, flexShrink: 0, cursor: 'pointer', overflow: 'hidden', border: '1px solid var(--rule)' }}
                  onClick={() => fileInputRef.current?.click()}
                  title="Change photo"
                >
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="Profile" width={60} height={60} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 18, color: 'var(--paper)' }}>
                      {user.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'U'}
                    </div>
                  )}
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                  >
                    {uploading
                      ? <Loader2 size={16} style={{ color: '#fff', animation: 'db-spin 0.8s linear infinite' }} />
                      : <Camera size={16} style={{ color: '#fff' }} />
                    }
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 180 }}>
                  <input
                    type="text"
                    className="db-inp"
                    placeholder="https://…/avatar.jpg"
                    value={avatarUrl}
                    onChange={e => setAvatarUrl(e.target.value)}
                    style={{ marginBottom: 8 }}
                  />
                  <button
                    type="button"
                    className="db-ghost"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 size={9} style={{ animation: 'db-spin 0.8s linear infinite' }} /> : <Camera size={9} />}
                    {uploading ? 'Uploading…' : 'Upload file'}
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                </div>
              </div>
              <p style={{ fontFamily: 'var(--ff-mono)', fontSize: 9, color: 'var(--mid)', marginTop: 8, letterSpacing: '0.04em' }}>
                Max 2 MB · JPEG or PNG · paste a URL or upload directly
              </p>
            </div>

            {/* Display name */}
            <FieldRow label="Display Name" icon={User}>
              <input
                type="text"
                className="db-inp"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </FieldRow>

            {/* Email — read only */}
            <FieldRow label="Email Address" icon={Mail} note="Email cannot be changed. Contact an admin if needed.">
              <div style={{
                fontFamily: 'var(--ff-mono)',
                fontSize: 13,
                color: 'var(--mid)',
                letterSpacing: '0.04em',
                padding: '9px 0',
                borderBottom: '1.5px solid var(--rule)',
                opacity: 0.7,
              }}>
                {user.email}
              </div>
            </FieldRow>

            {/* Department — read only */}
            <FieldRow label="Department" icon={Briefcase}>
              <div style={{
                fontFamily: 'var(--ff-mono)',
                fontSize: 13,
                color: 'var(--mid)',
                letterSpacing: '0.04em',
                padding: '9px 0',
                borderBottom: '1.5px solid var(--rule)',
                opacity: 0.7,
              }}>
                {user.department || 'Not assigned'}
              </div>
            </FieldRow>

            {/* Access */}
            <FieldRow label="Access Level" icon={Shield}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
                <span className={`db-status ${user.admin_access ? 'published' : 'draft'}`}>
                  {user.admin_access ? 'Administrator' : 'Editor'}
                </span>
                <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 9.5, color: 'var(--mid)', letterSpacing: '0.04em' }}>
                  {user.admin_access ? 'Full platform access' : 'Standard contributor access'}
                </span>
              </div>
            </FieldRow>

            {/* Save */}
            <div style={{ paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontFamily: 'var(--ff-display)', fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>Save Changes</div>
                <p style={{ fontFamily: 'var(--ff-mono)', fontSize: 9.5, color: 'var(--mid)', letterSpacing: '0.04em' }}>
                  Updates apply immediately across Carcino Vantage
                </p>
              </div>
              <button
                type="submit"
                className="db-btn"
                disabled={saving}
                style={{ padding: '10px 22px', fontSize: 10 }}
              >
                {saving
                  ? <Loader2 size={11} style={{ animation: 'db-spin 0.8s linear infinite' }} />
                  : <Save size={11} strokeWidth={2} />
                }
                <span>{saving ? 'Saving…' : '✦ Save profile'}</span>
              </button>
            </div>
          </form>
        </main>
      </div>

      {/* ══ MOBILE BOTTOM NAV ════════════════════════════════════ */}
      <nav className="db-mobile-nav">
        <div className="db-tape-bar">
          <div className="db-tape">
            {['PROFILE', 'SETTINGS', 'ACCOUNT', 'VANTAGE', '✦', 'PROFILE', 'SETTINGS', 'ACCOUNT', 'VANTAGE', '✦'].map((item, i) => (
              <span key={i} className="db-cap" style={{ color: item === '✦' ? 'var(--accent)' : 'rgba(240,236,228,0.7)', padding: '0 14px' }}>{item}</span>
            ))}
          </div>
        </div>
        <div className="db-mob-inner">
          {[
            { id: 'home',    label: 'Home',    href: '/',       path: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' },
            { id: 'tasks',   label: 'Tasks',   href: '/tasks',  path: 'M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16' },
            { id: 'team',    label: 'Team',    href: '/team',   path: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75' },
            { id: 'profile', label: 'Profile', href: '/profile', path: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
          ].map(item => (
            <Link key={item.id} href={item.href} className={`db-mob-item${item.id === 'profile' ? ' active' : ''}`}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {item.path.split(' M').map((d, i) => <path key={i} d={i === 0 ? d : 'M' + d} />)}
              </svg>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {showCropModal && tempImage && (
        <ImageCropModal
          image={tempImage}
          onCrop={handleCropComplete}
          onCancel={() => { setShowCropModal(false); setTempImage(null); }}
        />
      )}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onClose={() => setShowSettings(false)}
          onChange={next => {
            setSettings(next);
            saveSettings(next);
            applySettings(next);
          }}
        />
      )}
    </div>
  );
}