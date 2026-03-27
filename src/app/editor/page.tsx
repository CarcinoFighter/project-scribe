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
    { id: 'home',  label: 'Overview', href: '/' },
    { id: 'tasks', label: 'Assignments', href: '/tasks' },
    { id: 'team',  label: 'Team',       href: '/team' },
  ];

  return (
    <div className="min-h-[100dvh] bg-[var(--paper)] text-[var(--ink)] flex flex-col">
      
      {/* Header */}
      <header className="db-header flex items-center justify-between px-4 md:px-6 h-[42px] border-b border-[var(--rule)] bg-[var(--paper)] sticky top-0 z-50">
        {/* Left: Logo */}
        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
          <Link href="/" className="flex items-center gap-2 text-[var(--ink)] no-underline">
            <Logo size={14} />
            <span className="font-[var(--ff-display)] text-[15px] font-bold tracking-tight hidden sm:block">
              Carcino Vantage
            </span>
          </Link>
          <span className="hidden sm:block text-[var(--rule)] text-sm font-[var(--ff-mono)]">/</span>
          <span className="hidden sm:block font-[var(--ff-mono)] text-[9px] tracking-[0.14em] uppercase text-[var(--mid)]">
            Team
          </span>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-[320px] mx-2 md:mx-4 hidden sm:block">
          <div className="relative">
            <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--mid)]" />
            <input
              type="text"
              placeholder="Search team..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-transparent border border-[var(--rule)] py-1.5 pl-8 pr-3 font-[var(--ff-mono)] text-[10px] tracking-wide text-[var(--ink)] focus:border-[var(--accent)] outline-none transition-colors"
            />
          </div>
        </div>

        {/* Mobile Search Toggle */}
        <div className="flex-1 sm:hidden mx-2">
          <div className="relative">
            <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--mid)]" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-transparent border border-[var(--rule)] py-1.5 pl-8 pr-3 font-[var(--ff-mono)] text-[10px] text-[var(--ink)] focus:border-[var(--accent)] outline-none"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button 
            className="db-icon-btn w-7 h-7 flex items-center justify-center border border-transparent hover:border-[var(--rule)] text-[var(--mid)] hover:text-[var(--ink)] transition-colors" 
            onClick={toggleTheme}
          >
            {isDark ? <Sun size={13} /> : <Moon size={13} />}
          </button>
          
          <div className="hidden sm:block w-px h-4 bg-[var(--rule)] mx-1" />
          
          <button
            ref={accountBtnRef}
            className="flex items-center gap-2 px-2 py-1 border border-transparent hover:border-[var(--rule)] text-[var(--ink)] transition-colors"
            onClick={() => {
              if (!showAccountMenu && accountBtnRef.current) {
                const r = accountBtnRef.current.getBoundingClientRect();
                setAccountMenuPos({ top: r.bottom + 5, right: window.innerWidth - r.right });
              }
              setShowAccountMenu(o => !o);
            }}
          >
            {currentUser?.avatar_url ? (
              <div className="w-5 h-5 border border-[var(--rule)] overflow-hidden">
                <Image src={currentUser.avatar_url} alt="Profile" width={20} height={20} />
              </div>
            ) : (
              <div className="db-avatar w-5 h-5 flex items-center justify-center bg-[var(--accent)] text-[var(--paper)] text-xs font-[var(--ff-mono)]">
                {currentUser?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'U'}
              </div>
            )}
            <span className="hidden md:block font-[var(--ff-mono)] text-[9px] font-medium tracking-wider text-[var(--ink)]">
              {currentUser?.name || ''}
            </span>
            <ChevronDown size={10} className="hidden sm:block text-[var(--mid)]" />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex w-[210px] flex-shrink-0 flex-col border-r border-[var(--rule)] bg-[var(--paper)] overflow-y-auto">
          <div className="db-sidebar-label px-5 py-2 font-[var(--ff-mono)] text-[8px] font-semibold tracking-[0.22em] uppercase text-[var(--ink)] opacity-90">
            Navigate
          </div>

          {NAV_ITEMS.map((item, i) => (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-2 px-5 py-2 border-l-2 border-t border-[var(--rule)] bg-transparent font-[var(--ff-mono)] text-[9px] font-medium tracking-wide uppercase text-[var(--ink)] text-left w-full transition-colors hover:bg-[rgba(152,117,193,0.06)] ${item.id === activeNav ? 'border-l-[var(--accent)] text-[var(--accent)] bg-[rgba(152,117,193,0.04)]' : 'border-l-transparent'}`}
            >
              <span className={`font-[var(--ff-display)] italic text-[10px] w-4 flex-shrink-0 ${item.id === activeNav ? 'text-[var(--accent)]' : 'text-[var(--mid)]'}`}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="flex-1">{item.label}</span>
            </Link>
          ))}

          <div className="h-px bg-[var(--rule)] my-3" />
          
          <div className="db-sidebar-label px-5 py-2 font-[var(--ff-mono)] text-[8px] font-semibold tracking-[0.22em] uppercase text-[var(--ink)] opacity-90">
            Filter
          </div>

          <button
            className={`flex items-center gap-2 px-5 py-2 border-l-2 border-t border-[var(--rule)] bg-transparent font-[var(--ff-mono)] text-[9px] font-medium tracking-wide uppercase text-[var(--ink)] text-left w-full transition-colors hover:bg-[rgba(152,117,193,0.06)] ${filter === 'all' ? 'border-l-[var(--accent)] text-[var(--accent)]' : 'border-l-transparent'}`}
            onClick={() => setFilter('all')}
          >
            <span className="font-[var(--ff-display)] italic text-[10px] w-4 flex-shrink-0 text-[var(--mid)]">—</span>
            <span className="flex-1">All ({members.length})</span>
          </button>

          <button
            className={`flex items-center gap-2 px-5 py-2 border-l-2 border-t border-[var(--rule)] bg-transparent font-[var(--ff-mono)] text-[9px] font-medium tracking-wide uppercase text-[var(--ink)] text-left w-full transition-colors hover:bg-[rgba(152,117,193,0.06)] ${filter === 'admin' ? 'border-l-[var(--accent)] text-[var(--accent)]' : 'border-l-transparent'}`}
            onClick={() => setFilter('admin')}
          >
            <span className="w-4 flex-shrink-0"><Shield size={9} /></span>
            <span className="flex-1">Admins</span>
          </button>

          <div className="h-px bg-[var(--rule)] my-3" />
          
          <div className="db-sidebar-label px-5 py-2 font-[var(--ff-mono)] text-[8px] font-semibold tracking-[0.22em] uppercase text-[var(--ink)] opacity-90">
            Departments
          </div>

          {DEPARTMENTS.filter(d => d !== 'Other').map((dept) => {
            const count = members.filter(m => m.department === dept).length;
            return (
              <button
                key={dept}
                className={`flex items-center gap-2 px-5 py-2 border-l-2 border-t border-[var(--rule)] bg-transparent font-[var(--ff-mono)] text-[9px] font-medium tracking-wide uppercase text-[var(--ink)] text-left w-full transition-colors hover:bg-[rgba(152,117,193,0.06)] ${filter === dept ? 'border-l-[var(--accent)] text-[var(--accent)]' : 'border-l-transparent'}`}
                onClick={() => setFilter(dept)}
              >
                <span className="font-[var(--ff-display)] italic text-[10px] w-4 flex-shrink-0 text-[var(--mid)]">
                  {DEPT_NUM[dept]}
                </span>
                <span className="flex-1 truncate">{dept}</span>
                {count > 0 && (
                  <span className={`font-[var(--ff-mono)] text-[8px] px-1.5 py-0.5 tracking-wide ${filter === dept ? 'bg-[var(--accent)] text-[var(--paper)]' : 'bg-[var(--accent-dim)] text-[var(--mid)]'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-[var(--paper)] p-4 md:p-8 pb-20 md:pb-8">
          
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div>
                <h1 className="font-[var(--ff-display)] text-[28px] md:text-[34px] font-bold tracking-tight text-[var(--ink)] leading-none">
                  Team<em className="text-[var(--accent)]">.</em>
                </h1>
                <p className="mt-2 font-[var(--ff-mono)] text-[9px] tracking-[0.1em] uppercase text-[var(--mid)]">
                  {totalShown} member{totalShown !== 1 ? 's' : ''} — The Carcino Foundation
                </p>
              </div>
              {currentUser?.admin_access && (
                <button className="db-btn self-start flex items-center gap-2 px-4 py-2 bg-[var(--ink)] text-[var(--paper)] font-[var(--ff-mono)] text-[9px] font-medium tracking-[0.16em] uppercase clip-path-polygon hover:opacity-90 transition-opacity">
                  <Plus size={10} strokeWidth={2.2} />
                  <span>Invite</span>
                </button>
              )}
            </div>
            
            <div className="w-full h-px bg-[var(--rule)] mb-6 shadow-[0_1px_0_var(--ink),0_2px_0_var(--rule)]" />
          </div>

          {/* Mobile Filter Dropdown */}
          <div className="md:hidden mb-6">
            <label className="block font-[var(--ff-mono)] text-[8px] tracking-[0.2em] uppercase text-[var(--mid)] mb-2">
              Filter Department
            </label>
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full appearance-none bg-[var(--paper)] border border-[var(--rule)] px-3 py-2.5 pr-10 font-[var(--ff-mono)] text-[11px] text-[var(--ink)] focus:border-[var(--accent)] outline-none"
              >
                <option value="all">All Members ({members.length})</option>
                <option value="admin">Administrators</option>
                {DEPARTMENTS.filter(d => d !== 'Other').map(d => (
                  <option key={d} value={d}>{d} ({members.filter(m => m.department === d).length})</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--mid)] pointer-events-none" />
            </div>
          </div>

          {/* Desktop Filter Tabs */}
          <div className="hidden md:flex flex-wrap gap-0 border border-[var(--rule)] mb-8">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 border-r border-[var(--rule)] font-[var(--ff-mono)] text-[8px] tracking-[0.14em] uppercase transition-colors ${filter === 'all' ? 'bg-[var(--ink)] text-[var(--paper)]' : 'text-[var(--mid)] hover:text-[var(--ink)] hover:bg-[var(--accent-sub)]'}`}
            >
              All ({members.length})
            </button>
            <button
              onClick={() => setFilter('admin')}
              className={`px-4 py-2 border-r border-[var(--rule)] font-[var(--ff-mono)] text-[8px] tracking-[0.14em] uppercase transition-colors ${filter === 'admin' ? 'bg-[var(--ink)] text-[var(--paper)]' : 'text-[var(--mid)] hover:text-[var(--ink)] hover:bg-[var(--accent-sub)]'}`}
            >
              Admins
            </button>
            {DEPARTMENTS.filter(d => d !== 'Other').map((dept) => (
              <button
                key={dept}
                onClick={() => setFilter(dept)}
                className={`px-4 py-2 border-r border-[var(--rule)] last:border-r-0 font-[var(--ff-mono)] text-[8px] tracking-[0.14em] uppercase transition-colors ${filter === dept ? 'bg-[var(--ink)] text-[var(--paper)]' : 'text-[var(--mid)] hover:text-[var(--ink)] hover:bg-[var(--accent-sub)]'}`}
              >
                {dept}
              </button>
            ))}
          </div>

          {/* Members List */}
          {loading ? (
            <div className="border border-[var(--rule)] border-b-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 border-b border-[var(--rule)] animate-pulse bg-[var(--cream)] opacity-50" />
              ))}
            </div>
          ) : totalShown === 0 ? (
            <div className="py-12 text-center border border-[var(--rule)]">
              <Users size={28} className="mx-auto mb-3 text-[var(--mid)]" />
              <p className="font-[var(--ff-mono)] text-[10px] tracking-[0.14em] uppercase text-[var(--mid)]">
                No members found
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-8 md:gap-10">
              {Object.entries(groupedMembers).map(([dept, deptMembers], deptIndex) => (
                <section key={dept} className="animate-[fadeIn_0.4s_ease-out]" style={{ animationDelay: `${deptIndex * 0.05}s` }}>
                  
                  {/* Department Header */}
                  <div className="flex items-center gap-3 mb-4 pb-2 border-b border-[var(--rule)]">
                    <span className="font-[var(--ff-display)] italic text-[11px] text-[var(--accent)] w-6">
                      {DEPT_NUM[dept] || String(deptIndex + 1).padStart(2, '0')}
                    </span>
                    <span className="font-[var(--ff-mono)] text-[9px] tracking-[0.2em] uppercase text-[var(--ink)] font-medium">
                      {dept}
                    </span>
                    <div className="flex-1 h-px bg-[var(--rule)]" />
                    <span className="font-[var(--ff-mono)] text-[8px] font-bold tracking-wider bg-[var(--accent)] text-[var(--paper)] px-2 py-0.5">
                      {deptMembers.length}
                    </span>
                  </div>

                  {/* Members Cards */}
                  <div className="grid gap-3 md:gap-0 md:border md:border-[var(--rule)] md:border-b-0">
                    {deptMembers.map((member) => (
                      <div
                        key={member.id}
                        className="bg-[var(--paper)] md:bg-transparent border md:border-0 border-[var(--rule)] p-4 md:p-0 md:border-b md:border-[var(--rule)] hover:bg-[var(--accent-sub)] transition-colors group"
                      >
                        {/* Mobile Layout */}
                        <div className="md:hidden">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="relative flex-shrink-0">
                              <div className="w-10 h-10 border border-[var(--rule)] overflow-hidden">
                                {member.avatar_url ? (
                                  <Image src={member.avatar_url} alt={member.name} width={40} height={40} className="object-cover w-full h-full" />
                                ) : (
                                  <div className="w-full h-full bg-[var(--accent-dim)] flex items-center justify-center font-[var(--ff-display)] font-bold text-sm text-[var(--accent)]">
                                    {member.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                                  </div>
                                )}
                              </div>
                              {member.admin_access && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[var(--accent)] flex items-center justify-center" title="Admin">
                                  <Shield size={8} className="text-[var(--paper)]" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-[var(--ff-display)] text-sm font-bold text-[var(--ink)] truncate">
                                  {member.name}
                                </h3>
                                {member.admin_access && (
                                  <span className="flex-shrink-0 px-1.5 py-0.5 border border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-sub)] font-[var(--ff-mono)] text-[7px] tracking-wider uppercase">
                                    Admin
                                  </span>
                                )}
                              </div>
                              <p className="font-[var(--ff-mono)] text-[9px] text-[var(--mid)] mb-1">
                                {member.position || 'Contributor'}
                              </p>
                              <p className="font-[var(--ff-mono)] text-[9px] text-[var(--mid)] flex items-center gap-1.5 truncate">
                                <Mail size={8} />
                                <span className="truncate">{member.email || `${member.username}@carcino.work`}</span>
                              </p>
                            </div>
                            
                            <div className={`w-2 h-2 flex-shrink-0 ${member.is_active ? 'bg-[#3e9a5e]' : 'bg-[var(--mid)]'}`} title={member.is_active ? 'Active' : 'Inactive'} />
                          </div>
                          
                          <div className="flex items-center gap-2 pt-3 border-t border-[var(--rule)]">
                            <a
                              href={`https://github.com/${member.username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--rule)] text-[var(--mid)] hover:text-[var(--accent)] hover:border-[var(--accent)] font-[var(--ff-mono)] text-[9px] transition-colors"
                            >
                              <Github size={10} />
                              <span>GitHub</span>
                            </a>
                            <a
                              href={`https://linkedin.com/in/${member.username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--rule)] text-[var(--mid)] hover:text-[var(--accent)] hover:border-[var(--accent)] font-[var(--ff-mono)] text-[9px] transition-colors"
                            >
                              <Linkedin size={10} />
                              <span>LinkedIn</span>
                            </a>
                            {currentUser?.admin_access && (
                              <button
                                onClick={() => setShowAssignModal(member)}
                                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-[var(--ink)] text-[var(--paper)] font-[var(--ff-mono)] text-[9px] tracking-wider uppercase hover:opacity-90 transition-opacity"
                              >
                                <Plus size={10} />
                                <span>Assign</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden md:grid md:grid-cols-[52px_1fr_auto] md:items-center md:gap-4 md:px-4 md:py-3.5">
                          {/* Avatar */}
                          <div className="relative">
                            <div className="w-10 h-10 border border-[var(--rule)] overflow-hidden">
                              {member.avatar_url ? (
                                <Image src={member.avatar_url} alt={member.name} width={40} height={40} className="object-cover w-full h-full" />
                              ) : (
                                <div className="w-full h-full bg-[var(--accent-dim)] flex items-center justify-center font-[var(--ff-display)] font-bold text-sm text-[var(--accent)]">
                                  {member.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                                </div>
                              )}
                            </div>
                            {member.admin_access && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[var(--accent)] flex items-center justify-center" title="Admin">
                                <Shield size={8} className="text-[var(--paper)]" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-[var(--ff-display)] text-[13px] font-bold text-[var(--ink)]">
                                {member.name}
                              </h3>
                              {member.admin_access && (
                                <span className="px-1.5 py-0.5 border border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-sub)] font-[var(--ff-mono)] text-[7px] tracking-wider uppercase">
                                  Admin
                                </span>
                              )}
                              <div className={`w-1.5 h-1.5 ${member.is_active ? 'bg-[#3e9a5e]' : 'bg-[var(--mid)]'}`} title={member.is_active ? 'Active' : 'Inactive'} />
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-[var(--ff-mono)] text-[9px] text-[var(--mid)]">
                                {member.position || 'Contributor'}
                              </span>
                              <span className="font-[var(--ff-mono)] text-[9px] text-[var(--mid)] flex items-center gap-1.5">
                                <Mail size={8} />
                                {member.email || `${member.username}@carcino.work`}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <a
                              href={`https://github.com/${member.username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 border border-[var(--rule)] text-[var(--mid)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors"
                              title="GitHub"
                            >
                              <Github size={10} />
                            </a>
                            <a
                              href={`https://linkedin.com/in/${member.username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 border border-[var(--rule)] text-[var(--mid)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors"
                              title="LinkedIn"
                            >
                              <Linkedin size={10} />
                            </a>
                            {currentUser?.admin_access && (
                              <button
                                onClick={() => setShowAssignModal(member)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--ink)] text-[var(--paper)] font-[var(--ff-mono)] text-[8px] tracking-wider uppercase hover:opacity-90 transition-opacity"
                              >
                                <Plus size={9} />
                                Assign
                              </button>
                            )}
                          </div>
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

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--paper)] border-t border-[var(--rule)] z-40">
        <div className="bg-[var(--tape-bg)] h-6 flex items-center overflow-hidden">
          <div className="flex whitespace-nowrap animate-[scroll_28s_linear_infinite]">
            {[...TAPE_ITEMS, ...TAPE_ITEMS].map((item, i) => (
              <span key={i} className="font-[var(--ff-mono)] text-[8px] tracking-wider uppercase px-3.5 text-[rgba(240,236,228,0.7)]">
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="flex h-[52px]">
          {[
            { id: 'home', label: 'Home', href: '/' },
            { id: 'tasks', label: 'Tasks', href: '/tasks' },
            { id: 'team', label: 'Team', href: '/team' },
          ].map(item => (
            <Link 
              key={item.id} 
              href={item.href} 
              className={`flex-1 flex flex-col items-center justify-center gap-1 border-r border-[var(--rule)] last:border-r-0 font-[var(--ff-mono)] text-[7px] tracking-wider uppercase transition-colors ${item.id === 'team' ? 'text-[var(--accent)] border-b-2 border-b-[var(--accent)] bg-[var(--accent-dim)]' : 'text-[var(--mid)]'}`}
            >
              {item.id === 'home' && (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
              )}
              {item.id === 'tasks' && (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              )}
              {item.id === 'team' && (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              )}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Overlays */}
      {showAccountMenu && accountMenuPos && createPortal(
        <div className="fixed z-[9960]" style={{ top: accountMenuPos.top, right: accountMenuPos.right }}>
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