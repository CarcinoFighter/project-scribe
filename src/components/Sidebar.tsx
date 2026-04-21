'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Home, FileText, BookOpen, Briefcase, Users, Star, Target, PenTool, ArrowRight, Layers 
} from 'lucide-react';

export interface SidebarProps {
  activeNav: string;
  isFullSidebar?: boolean;
  counts?: {
    articles?: number;
    blogs?: number;
    tasks?: number;
  };
  starredDocs?: Array<{ id: string; title: string }>;
  wordGoal?: number;
  lsDoc?: { words: number } | null;
  onNavClick?: (id: string) => void;
  children?: React.ReactNode;
}

export function Sidebar({
  activeNav,
  isFullSidebar = true,
  counts = {},
  starredDocs = [],
  wordGoal = 0,
  lsDoc = null,
  onNavClick,
  children
}: SidebarProps) {
  const router = useRouter();

  type NavItem = {
    id: string;
    label: string;
    icon: React.ElementType;
    count: number | null | undefined;
    href: string;
  };

  const NAV_ITEMS: NavItem[] = [
    { id: 'home',     label: 'Overview',    icon: Home,      count: null,                 href: '/'      },
    { id: 'queues',   label: 'Queues',      icon: Layers,    count: null,                 href: '/queues' },
    { id: 'articles', label: 'Articles',    icon: FileText,  count: counts.articles,      href: '/?nav=articles' },
    { id: 'blogs',    label: 'Blog Posts',  icon: BookOpen,  count: counts.blogs,         href: '/?nav=blogs'    },
    { id: 'tasks',    label: 'Assignments', icon: Briefcase, count: counts.tasks || null, href: '/tasks' },
    { id: 'team',     label: 'Team',        icon: Users,     count: null,                 href: '/team'  },
  ].filter(item => isFullSidebar || (item.id !== 'articles' && item.id !== 'blogs'));

  const handleNav = (item: NavItem) => {
    if (onNavClick && (item.id === 'articles' || item.id === 'blogs' || item.id === 'home')) {
      onNavClick(item.id);
    } else if (item.href) {
      router.push(item.href);
    } else if (onNavClick) {
      onNavClick(item.id);
    }
  };

  return (
    <aside className="db-sidebar">
      <div className="db-sidebar-label">Workspace</div>

      {NAV_ITEMS.map((item, i) => {
        const isActive = activeNav === item.id;
        const inner = (
          <>
            <span className="db-nav-num">{String(i + 1).padStart(2, '0')}</span>
            <item.icon size={11} strokeWidth={isActive ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.count !== null && (item.count as number) > 0 && (
              <span style={{
                fontFamily: 'var(--ff-ui)', fontSize: 8, fontWeight: 700,
                letterSpacing: '0.08em', padding: '1px 5px',
                background: isActive ? 'var(--accent)' : 'var(--accent-dim)',
                color: isActive ? 'var(--paper)' : 'var(--mid)',
                flexShrink: 0,
              }}>
                {item.count}
              </span>
            )}
          </>
        );

        const className = `db-nav-item${isActive ? ' active' : ''}`;

        if (item.href && activeNav !== item.id) {
          return (
            <Link key={item.id} href={item.href} className={className}>
              {inner}
            </Link>
          );
        }

        return (
          <button 
            key={item.id} 
            className={className}
            onClick={() => handleNav(item)}
          >
            {inner}
          </button>
        );
      })}

      {children}

      {isFullSidebar && (
        <>
          <div className="db-sidebar-rule" />
          <div className="db-sidebar-label">Starred</div>

          {starredDocs.length === 0 ? (
            <p style={{ fontFamily: 'var(--ff-ui)', fontSize: 9, color: 'var(--mid)', padding: '3px 20px', lineHeight: 1.7, letterSpacing: '0.04em' }}>
              Star a document to pin it here.
            </p>
          ) : (
            starredDocs.map(doc => (
              <button key={doc.id} className="db-starred-row" onClick={() => router.push('/editor')}>
                <Star size={8} fill="var(--accent)" stroke="none" style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {doc.title.length > 24 ? doc.title.slice(0, 24) + '…' : doc.title}
                </span>
              </button>
            ))
          )}

          {wordGoal > 0 && lsDoc && (
            <>
              <div className="db-sidebar-rule" />
              <div className="db-goal">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Target size={10} style={{ color: 'var(--accent)' }} />
                    <span className="db-cap" style={{ color: 'var(--accent)' }}>Word Goal</span>
                  </div>
                  <span className="db-cap" style={{ color: 'var(--accent)' }}>
                    {Math.round((lsDoc.words / wordGoal) * 100)}%
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--ff-ui)', fontSize: 10.5, color: 'var(--ink)', fontWeight: 500, marginBottom: 7, letterSpacing: '0.04em' }}>
                  {lsDoc.words.toLocaleString()} <span style={{ color: 'var(--mid)', fontWeight: 400 }}>/ {wordGoal.toLocaleString()}</span>
                </div>
                <div style={{ height: 2, background: 'var(--rule)' }}>
                  <div style={{ 
                    height: '100%', 
                    background: lsDoc.words >= wordGoal ? '#4ade80' : 'var(--accent)', 
                    width: `${Math.min((lsDoc.words / wordGoal) * 100, 100)}%`, 
                    transition: 'width 0.4s cubic-bezier(0.34,1.2,0.64,1)' 
                  }} />
                </div>
              </div>
            </>
          )}

          <div style={{ flex: 1 }} />

          <div style={{ padding: '0 16px 4px', borderTop: '1px solid var(--rule)', paddingTop: 12 }}>
            <Link href="/editor" className="db-btn" style={{ width: '100%', justifyContent: 'space-between' }}>
              <PenTool size={10} strokeWidth={2} />
              <span style={{ flex: 1, paddingLeft: 6 }}>Open Editor</span>
              <ArrowRight size={10} />
            </Link>
          </div>
        </>
      )}
    </aside>
  );
}
