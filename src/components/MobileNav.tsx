'use client';

import React from 'react';
import Link from 'next/link';
import { Home, FileText, BookOpen, Briefcase, Users, Layers } from 'lucide-react';

interface MobileNavProps {
  activeNav: string;
  pendingTasksCount?: number;
  isFullSidebar?: boolean;
}


export default function MobileNav({ activeNav, pendingTasksCount = 0, isFullSidebar = true }: MobileNavProps) {
  const NAV_ITEMS = ([
    { id: 'home',     label: 'Overview',    icon: Home,      href: '/' },
    { id: 'queues',   label: 'Queues',      icon: Layers,    href: '/queues' },
    { id: 'articles', label: 'Articles',    icon: FileText,  href: '/?nav=articles' },
    { id: 'blogs',    label: 'Blog Posts',  icon: BookOpen,  href: '/?nav=blogs' },
    { id: 'tasks',    label: 'Assignments', icon: Briefcase, href: '/tasks' },
    { id: 'team',     label: 'Team',        icon: Users,     href: '/team' },
  ] as const);

  return (
    <nav className={`db-mobile-nav${isFullSidebar ? ' is-full' : ''}`} aria-label="Primary navigation">
      {/* Tape strip at top of mobile nav */}
      <div className="db-mob-inner">
        {NAV_ITEMS.map((item) => {
          const isActive = activeNav === item.id;
          return (
            <Link 
              key={item.id} 
              href={item.href} 
              className={`db-mob-item${isActive ? ' active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              title={item.label}
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
