'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/useTheme';
import {
  Users, Mail, Shield, Search, Sun, Moon,
  Github, Linkedin, Plus, ChevronDown,
} from 'lucide-react';
import { useUser } from '@/lib/useUser';
import AccountMenu from '@/components/AccountMenu';
import AssignTaskModal from '@/components/AssignTaskModal';
import Toast from '@/components/Toast';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  username: string;
  avatar_url: string | null;
  position: string;
  department: string;
  is_active: boolean;
  admin_access: boolean;
}

const DEPARTMENTS = [
  "Leadership",
  "Writers' Block",
  "Public Relations",
  "Design Lab",
  "Development",
  "Other",
];

const DEPT_NUM: Record<string, string> = {
  "Leadership":       "01",
  "Writers' Block":   "02",
  "Public Relations": "03",
  "Design Lab":       "04",
  "Development":      "05",
  "Other":            "06",
};

const TAPE_ITEMS = ['LEADERSHIP', 'WRITERS', 'DESIGN', 'DEV', 'PR', 'TEAM', '2026', '✦'];

function Logo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 1.2)} viewBox="0 0 20 24" fill="none" aria-hidden>
      <path d="M9.13307 5.97435C9.21934 5.23291 9.33279 4.80925 9.89802 4.0092C10.9029 2.80263 11.6709 2.67501 12.9912 2.4556L13.0042 2.45344C14.8586 2.34816 15.7395 3.26056 16.1799 4.26653C16.6203 5.27251 16.5553 7.03881 16.4233 7.9863C16.2913 8.93378 15.7627 11.4166 12.7608 13.8614C13.5837 14.1538 13.6573 14.1074 14.65 14.2561C15.6004 13.2384 16.1436 12.4864 17.5128 10.8405C18.882 9.19453 19.661 6.91014 19.8772 5.50646C20.0934 4.10278 20.1438 2.45344 18.9963 1.26031C17.8489 0.0671784 15.5888 -0.131673 14.198 0.067179C12.8072 0.266031 10.3732 1.26031 8.68105 2.6289C6.98888 3.9975 6.20076 5.50646 5.57488 7.5418C4.949 9.57714 5.30938 11.2467 6.08485 13.332C7.40174 16.0707 9.01717 17.9291 10.4196 18.8415C11.822 19.7539 12.8072 20.2451 14.3487 22.842C16.2495 19.8123 16.9991 18.6706 18.4632 16.9465C17.5128 15.7767 16.2842 15.1142 13.8735 14.7825C11.4627 14.4508 10.6865 13.6665 10.2341 13.6478C9.78183 13.6291 9.26057 13.6244 9.09831 13.5776C8.93605 13.5309 8.89093 13.5242 8.76218 13.2384C8.62326 12.7331 8.76218 11.9985 8.76218 11.8932C8.76218 11.7879 8.54197 11.6476 8.54197 11.5072C8.54197 11.3668 8.61607 11.2835 8.77377 11.2031C8.77377 11.2031 8.41448 11.0042 8.41448 10.8405C8.41448 10.6767 8.57673 10.0567 8.54197 9.91637C8.50721 9.776 7.68429 9.60054 7.83497 9.3198C7.98565 9.03906 9.16153 7.60314 9.30692 7.30785C9.45232 7.01256 9.15359 6.6787 9.13307 5.97435Z" fill="currentColor"/>
      <path d="M8.00883 18.0928C5.32942 19.6789 3.54237 20.5984 1.2981 21.2277L0 24C1.2981 23.9064 5.74874 21.7424 9.23739 19.169L8.00883 18.0928Z" fill="currentColor"/>
    </svg>
  );
}

export default function TeamPage() {
  const router = useRouter();
  const { user: currentUser, loading: userLoading } = useUser();
  const { isDark, toggleTheme } = useTheme();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [accountMenuPos, setAccountMenuPos] = useState<{ top: number; right: number } | null>(null);
  const accountBtnRef = useRef<HTMLButtonElement>(null);
  const [showAssignModal, setShowAssignModal] = useState<TeamMember | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [activeNav, setActiveNav] = useState('team');

  useEffect(() => {
    if (!userLoading && !currentUser) router.push('/login');
  }, [currentUser, userLoading, router]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/team');
        if (res.ok) { const data = await res.json(); setMembers(data.users); }
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const filteredMembers = members.filter(m => {
    let ok = true;
    if (filter === 'admin') ok = m.admin_access;
    else if (filter !== 'all') ok = m.department === filter;
    const q = search.toLowerCase();
    return ok && (!q ||
      m.name.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.username.toLowerCase().includes(q) ||
      m.department?.toLowerCase().includes(q)
    );
  });

  const groupedMembers = DEPARTMENTS.reduce<Record<string, TeamMember[]>>((acc, dept) => {
    const list = filteredMembers.filter(m => {
      const d = m.department || 'Other';
      if (dept === 'Other') return !DEPARTMENTS.slice(0, -1).includes(d);
      return d === dept;
    });
    if (list.length > 0) acc[dept] = list;
    return acc;
  }, {});

  const totalShown = Object.values(groupedMembers).flat().length;

  const NAV_ITEMS = [
    { id: 'home',  label: 'Dashboard', href: '/' },
    { id: 'tasks', label: 'Assignments', href: '/tasks' },
    { id: 'team',  label: 'Team',       href: '/team' },
  ];

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--paper)', color: 'var(--ink)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header className="db-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, userSelect: 'none' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink)', textDecoration: 'none' }}>
            <Logo size={14} />
            <span style={{ fontFamily: 'var(--ff-display)', fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
              <span className="hidden sm:inline"> Carcino</span> Vantage
            </span>
          </Link>
          <span style={{ color: 'var(--rule)', fontSize: 14, fontFamily: 'var(--ff-mono)' }}>/</span>
          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--mid)' }}>Team</span>
        </div>

        <div className="db-vr" />

        <div style={{ position: 'relative', flex: 1, maxWidth: 320, display: 'flex', alignItems: 'center' }}>
          <Search size={11} style={{ position: 'absolute', left: 10, color: 'var(--mid)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search name, email, dept…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              background: 'transparent',
              border: '1px solid var(--rule)',
              padding: '5px 10px 5px 28px',
              fontFamily: 'var(--ff-mono)',
              fontSize: 10,
              letterSpacing: '0.04em',
              color: 'var(--ink)',
              outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--rule)')}
          />
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <button className="db-icon-btn" onClick={toggleTheme} title={isDark ? 'Light' : 'Dark'}>
            {isDark ? <Sun size={13} strokeWidth={1.8} /> : <Moon size={13} strokeWidth={1.8} />}
          </button>
          <div className="db-vr" />
          <button
            ref={accountBtnRef}
            className="db-ghost"
            style={{ gap: 6, padding: '3px 8px 3px 4px' }}
            onClick={() => {
              if (!showAccountMenu && accountBtnRef.current) {
                const r = accountBtnRef.current.getBoundingClientRect();
                setAccountMenuPos({ top: r.bottom + 5, right: window.innerWidth - r.right });
              }
              setShowAccountMenu(o => !o);
            }}
          >
            {currentUser?.avatar_url ? (
              <div style={{ width: 20, height: 20, overflow: 'hidden', border: '1px solid var(--rule)' }}>
                <Image src={currentUser.avatar_url} alt="Profile" width={20} height={20} />
              </div>
            ) : (
              <div className="db-avatar" style={{ width: 20, height: 20 }}>
                {currentUser?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'U'}
              </div>
            )}
            <span className="hidden md:block" style={{ fontFamily: 'var(--ff-mono)', fontSize: 9.5, fontWeight: 500, letterSpacing: '0.06em', color: 'var(--ink)' }}>
              {currentUser?.name || ''}
            </span>
            <ChevronDown size={10} className="hidden sm:block" style={{ color: 'var(--mid)' }} />
          </button>
        </div>
      </header>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* Sidebar */}
        <aside className="db-sidebar">
          <div className="db-sidebar-label">Navigate</div>

          {NAV_ITEMS.map((item, i) => (
            <Link
              key={item.id}
              href={item.href}
              className={`db-nav-item${item.id === activeNav ? ' active' : ''}`}
            >
              <span className="db-nav-num">{String(i + 1).padStart(2, '0')}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
            </Link>
          ))}

          <div className="db-sidebar-rule" />
          <div className="db-sidebar-label">Filter</div>

          {[{ key: 'all', label: `All (${members.length})` }, { key: 'admin', label: 'Admins' }].map(f => (
            <button
              key={f.key}
              className={`db-nav-item${filter === f.key ? ' active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              <span className="db-nav-num">{f.key === 'all' ? '—' : <Shield size={9} />}</span>
              <span style={{ flex: 1 }}>{f.label}</span>
            </button>
          ))}

          <div className="db-sidebar-rule" />
          <div className="db-sidebar-label">Departments</div>

          {DEPARTMENTS.filter(d => d !== 'Other').map((dept, i) => {
            const count = members.filter(m => m.department === dept).length;
            return (
              <button
                key={dept}
                className={`db-nav-item${filter === dept ? ' active' : ''}`}
                onClick={() => setFilter(dept)}
              >
                <span className="db-nav-num" style={{ fontStyle: 'italic', fontFamily: 'var(--ff-display)' }}>
                  {DEPT_NUM[dept]}
                </span>
                <span style={{ flex: 1 }}>{dept}</span>
                {count > 0 && (
                  <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 8, background: filter === dept ? 'var(--accent)' : 'var(--accent-dim)', color: filter === dept ? 'var(--paper)' : 'var(--mid)', padding: '1px 5px', letterSpacing: '0.08em' }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Main */}
        <main className="db-main">

          {/* Page title */}
          <div className="db-rise-0" style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <h1 className="db-page-title">Team<em>.</em></h1>
                <p className="db-page-sub" style={{ marginTop: 6 }}>
                  {totalShown} member{totalShown !== 1 ? 's' : ''} — The Carcino Foundation
                </p>
              </div>
              {currentUser?.admin_access && (
                <button className="db-btn">
                  <Plus size={10} strokeWidth={2.2} />
                  <span className="hidden sm:inline">Invite</span>
                </button>
              )}
            </div>
          </div>
          <hr className="db-triple-rule" />

          {/* Filter bar - Scrollable */}
          <div className="db-filter-bar db-rise-1" style={{
            display: 'flex',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            gap: 0,
            flexWrap: 'nowrap',
            border: '1px solid var(--rule)',
          }}>
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {[
              { k: 'all',   l: `All (${members.length})` },
              { k: 'admin', l: 'Admins' },
              ...DEPARTMENTS.filter(d => d !== 'Other').map(d => ({ k: d, l: d })),
            ].map(f => (
              <button
                key={f.k}
                className={`db-filter-btn${filter === f.k ? ' active' : ''}`}
                onClick={() => setFilter(f.k)}
                style={{ 
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  borderRight: '1px solid var(--rule)',
                  borderBottom: 'none',
                }}
              >
                {f.l}
              </button>
            ))}
          </div>

          {/* Members */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid var(--rule)', borderBottom: 'none' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ height: 64, borderBottom: '1px solid var(--rule)', background: i % 2 === 0 ? 'transparent' : 'var(--accent-sub)', opacity: 0.5 }} />
              ))}
            </div>
          ) : totalShown === 0 ? (
            <div style={{ padding: '48px 0', textAlign: 'center', border: '1px solid var(--rule)' }}>
              <Users size={28} style={{ color: 'var(--mid)', margin: '0 auto 12px' }} />
              <p style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--mid)' }}>
                No members found
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              {Object.entries(groupedMembers).map(([dept, deptMembers], si) => (
                <section key={dept} className="db-rise-1" style={{ animationDelay: `${si * 0.06}s` }}>
                  {/* Dept header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                    <span style={{
                      fontFamily: 'var(--ff-display)',
                      fontStyle: 'italic',
                      fontSize: 11,
                      color: 'var(--accent)',
                      width: 22,
                      flexShrink: 0,
                    }}>
                      {DEPT_NUM[dept] || String(si + 1).padStart(2, '0')}
                    </span>
                    <span className="db-cap" style={{ color: 'var(--ink)', letterSpacing: '0.2em', fontSize: 9 }}>{dept}</span>
                    <div style={{ flex: 1, height: 1, background: 'var(--rule)' }} />
                    <span style={{
                      fontFamily: 'var(--ff-mono)',
                      fontSize: 8,
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      background: 'var(--accent)',
                      color: 'var(--paper)',
                      padding: '1px 7px',
                    }}>
                      {deptMembers.length}
                    </span>
                  </div>

                  {/* Members grid list - Responsive */}
                  <div style={{ border: '1px solid var(--rule)', borderBottom: 'none' }}>
                    {deptMembers.map((member, mi) => (
                      <div
                        key={member.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          padding: '14px 18px',
                          borderBottom: '1px solid var(--rule)',
                          transition: 'background 0.12s',
                          background: 'transparent',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-sub)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* Top Row: Avatar + Info + Status */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                          {/* Avatar */}
                          <div style={{ position: 'relative', flexShrink: 0 }}>
                            <div style={{ width: 40, height: 40, overflow: 'hidden', border: '1px solid var(--rule)' }}>
                              {member.avatar_url ? (
                                <Image src={member.avatar_url} alt={member.name} width={40} height={40} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                              ) : (
                                <div style={{ width: '100%', height: '100%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 14, color: 'var(--accent)' }}>
                                  {member.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                                </div>
                              )}
                            </div>
                            {member.admin_access && (
                              <div style={{ position: 'absolute', bottom: -3, right: -3, background: 'var(--accent)', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Admin">
                                <Shield size={8} style={{ color: 'var(--paper)' }} />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                              <span style={{ fontFamily: 'var(--ff-display)', fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--ink)' }}>
                                {member.name}
                              </span>
                              {member.admin_access && (
                                <span className="db-status" style={{ color: 'var(--accent)', background: 'var(--accent-sub)', border: '1px solid var(--accent)', fontSize: 7, letterSpacing: '0.14em', padding: '1px 5px' }}>
                                  Admin
                                </span>
                              )}
                              <span style={{ width: 4, height: 4, background: member.is_active ? '#3e9a5e' : 'var(--mid)', flexShrink: 0 }} title={member.is_active ? 'Active' : 'Inactive'} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 9.5, color: 'var(--mid)', letterSpacing: '0.04em' }}>
                                {member.position || 'Contributor'}
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--ff-mono)', fontSize: 9, color: 'var(--mid)' }}>
                                <Mail size={9} strokeWidth={1.6} />
                                {member.email || `${member.username}@carcino.work`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Row: Actions - Inside card, full width */}
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 8, 
                          paddingTop: 12,
                          borderTop: '1px solid var(--rule)',
                          marginTop: 'auto'
                        }}>
                          <a
                            href={`https://github.com/${member.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="db-ghost"
                            style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}
                            title="GitHub"
                          >
                            <Github size={12} strokeWidth={1.8} />
                            <span style={{ fontSize: 9 }}>GitHub</span>
                          </a>
                          <a
                            href={`https://linkedin.com/in/${member.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="db-ghost"
                            style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}
                            title="LinkedIn"
                          >
                            <Linkedin size={12} strokeWidth={1.8} />
                            <span style={{ fontSize: 9 }}>LinkedIn</span>
                          </a>
                          {currentUser?.admin_access && (
                            <button
                              className="db-btn"
                              style={{ padding: '6px 12px', fontSize: 8, marginLeft: 'auto' }}
                              onClick={() => setShowAssignModal(member)}
                            >
                              <Plus size={9} />
                              <span>Assign</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="db-mobile-nav">
        <div className="db-tape-bar">
          <div className="db-tape">
            {[...TAPE_ITEMS, ...TAPE_ITEMS].map((item, i) => (
              <span key={i} className="db-cap" style={{ color: i % 8 === 7 ? 'var(--accent)' : 'rgba(240,236,228,0.7)', padding: '0 14px' }}>{item}</span>
            ))}
          </div>
        </div>
        <div className="db-mob-inner">
          {[
            { id: 'home',  label: 'Home',  href: '/',      path: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' },
            { id: 'tasks', label: 'Tasks', href: '/tasks', path: 'M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16' },
            { id: 'team',  label: 'Team',  href: '/team',  path: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75' },
          ].map(item => (
            <Link key={item.id} href={item.href} className={`db-mob-item${item.id === 'team' ? ' active' : ''}`}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {item.path.split(' M').map((d, i) => <path key={i} d={i === 0 ? d : 'M' + d} />)}
              </svg>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Overlays */}
      {showAccountMenu && accountMenuPos && createPortal(
        <div style={{ position: 'fixed', top: accountMenuPos.top, right: accountMenuPos.right, zIndex: 9960 }}>
          <AccountMenu user={currentUser} onClose={() => setShowAccountMenu(false)} onToast={m => setToast(m)} />
        </div>,
        document.body
      )}
      {showAssignModal && (
        <AssignTaskModal
          member={showAssignModal}
          onClose={() => setShowAssignModal(null)}
          onSuccess={() => { setShowAssignModal(null); setToast('Task assigned successfully'); }}
        />
      )}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}