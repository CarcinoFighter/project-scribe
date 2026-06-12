import React from 'react';
import Link from 'next/link';
import { Home, Layers, FileText, BookOpen, Briefcase, Users } from 'lucide-react';

interface MobileNavProps {
  activeNav: string;
  pendingTasksCount?: number;
}

export default function MobileNav({ activeNav, pendingTasksCount = 0 }: MobileNavProps) {
  const navItems = [
    { id: 'home', label: 'Overview', icon: Home, href: '/' },
    { id: 'queues', label: 'Queues', icon: Layers, href: '/queues' },
    { id: 'articles', label: 'Articles', icon: FileText, href: '/?nav=articles' },
    { id: 'blogs', label: 'Blogs', icon: BookOpen, href: '/?nav=blogs' },
    { id: 'tasks', label: 'Tasks', icon: Briefcase, href: '/tasks', count: pendingTasksCount },
    { id: 'team', label: 'Team', icon: Users, href: '/team' },
  ];

  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 flex justify-center z-50 pointer-events-none">
      <nav className="flex items-center gap-0.5 p-1 bg-[#1a1a1f] border border-white/10 rounded-full shadow-2xl pointer-events-auto h-[48px]">
        {navItems.map((item) => {
          const isActive = activeNav === item.id;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`
                relative flex items-center justify-center h-full rounded-full transition-all duration-300 px-3
                ${isActive
                  ? 'bg-[#cfa5ef] text-[#120f18] min-w-[80px]'
                  : 'text-[#888891] hover:text-white w-[40px]'
                }
              `}
            >
              <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />

              {/* Labels are hidden on very narrow screens, visible on wider mobile layouts */}
              {isActive && (
                <span className="ml-2 text-[10px] font-bold uppercase tracking-wider hidden sm:block">
                  {item.label}
                </span>
              )}

              {/* Notification Badge */}
              {item.count > 0 && !isActive && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#cfa5ef] rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}