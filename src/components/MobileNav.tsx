'use client';

import React from 'react';
import Link from 'next/link';
import { Home, FileText, BookOpen, Briefcase, Users } from 'lucide-react';

interface MobileNavProps {
  activeNav: string;
  pendingTasksCount?: number;
  isFullSidebar?: boolean;
}

const TAPE_ITEMS = ['WRITERS', 'DESIGN', 'DEV', 'PR', 'LEADERSHIP', 'VANTAGE', '2026', '✦'];

export default function MobileNav({ activeNav, pendingTasksCount = 0, isFullSidebar = true }: MobileNavProps) {
  const NAV_ITEMS = ([
    { id: 'home',     label: 'Overview',    icon: Home,      href: '/' },
    { id: 'articles', label: 'Articles',    icon: FileText,  href: '/?nav=articles' },
    { id: 'blogs',    label: 'Blog Posts',  icon: BookOpen,  href: '/?nav=blogs' },
    { id: 'tasks',    label: 'Assignments', icon: Briefcase, href: '/tasks' },
    { id: 'team',     label: 'Team',        icon: Users,     href: '/team' },
  ] as const).filter(item => isFullSidebar || (item.id !== 'articles' && item.id !== 'blogs'));

  return (
    <nav className="db-mobile-nav">
      {/* Tape strip at top of mobile nav */}
      <div className="db-tape-bar">
        <div className="db-tape">
          {[...TAPE_ITEMS, ...TAPE_ITEMS].map((item, i) => (
            <span key={i} className="db-cap" style={{
              color: i % 8 === 7 || (i - 7) % 8 === 0 ? 'var(--accent)' : 'var(--cream)',
              opacity: 0.8, padding: '0 14px', marginBottom: 0,
            }}>{item}</span>
          ))}
        </div>
      </div>

      <div className="db-mob-inner">
        {NAV_ITEMS.map((item) => {
          const isActive = activeNav === item.id;
          return (
            <Link 
              key={item.id} 
              href={item.href} 
              className={`db-mob-item${isActive ? ' active' : ''}`}
            >
              <div className="db-mob-icon-wrap">
                <item.icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                {item.id === 'tasks' && pendingTasksCount > 0 && (
                  <span className="db-mob-badge">
                    {pendingTasksCount > 9 ? '9+' : pendingTasksCount}
                  </span>
                )}
              </div>
              <span className="db-mob-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
