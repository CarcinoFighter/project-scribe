'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/useUser';
import { useTheme } from '@/lib/useTheme';
import PageHeader from '@/components/PageHeader';
import { Sidebar } from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import { Calendar } from '@/components/Calendar';
import Toast from '@/components/Toast';
import { CalendarEvent } from '@/types/calendar';

interface TaskCounts {
  articles: number;
  blogs: number;
  tasks: number;
}

function CalendarPageContent() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { isDark } = useTheme();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [counts, setCounts] = useState<TaskCounts>({ articles: 0, blogs: 0, tasks: 0 });

  useEffect(() => {
    if (!userLoading && !user) router.push('/login');
  }, [user, userLoading, router]);

  useEffect(() => {
    (async () => {
      try {
        const [eventsRes, docsRes, tasksRes] = await Promise.all([
          fetch('/api/calendar/events'),
          fetch('/api/documents'),
          fetch('/api/tasks'),
        ]);

        let allEvents: CalendarEvent[] = [];

        if (eventsRes.ok) {
          const data = await eventsRes.json();
          allEvents = Array.isArray(data) ? data : [];
        }

        if (docsRes.ok) {
          const data = await docsRes.json();
          const docs = data.documents || [];
          setCounts(c => ({
            ...c,
            articles: docs.filter((d: any) => d.type === 'cancer_docs' || d.type === 'survivor_stories').length,
            blogs: docs.filter((d: any) => d.type === 'blogs').length,
          }));
        }

        if (tasksRes.ok) {
          const data = await tasksRes.json();
          const assignments = data.assignments || [];
          const taskCount = assignments.filter((t: any) => t.status !== 'done').length;
          setCounts(c => ({
            ...c,
            tasks: taskCount,
          }));

          // Convert tasks to calendar events
          const taskEvents: CalendarEvent[] = assignments
            .filter((task: any) => task.due_date && task.status !== 'done')
            .map((task: any) => ({
              id: `task-${task.id}`,
              title: task.title || task.document_title || 'Untitled Task',
              description: task.description,
              date: task.due_date.split('T')[0], // Ensure YYYY-MM-DD format
              time: '09:00', // Default task time
              duration_minutes: 60,
              assigned_to: task.assignees?.map((a: any) => a.id) || [task.assignee?.id].filter(Boolean) || [],
              created_by: task.assigned_by || '',
              department: task.department,
              created_at: task.created_at || new Date().toISOString(),
              updated_at: task.created_at || new Date().toISOString(),
              // Task-specific metadata
              document_id: task.document_id,
              document_type: task.category === 'article' ? 'cancer_docs' : task.category === 'blog' ? 'blogs' : task.category === 'survivor_story' ? 'survivor_stories' : undefined,
              task_category: task.category,
            }));

          allEvents = [...allEvents, ...taskEvents];
        }

        setEvents(allEvents);
      } catch (err) {
        console.error('Error loading data:', err);
        setToast('Failed to load calendar data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleEventCreated = (newEvent: CalendarEvent) => {
    setEvents(prev => [...prev, newEvent]);
    setToast('Event created successfully');
  };

  const handleEventUpdated = (updatedEvent: CalendarEvent) => {
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    setToast('Event updated');
  };

  const handleEventDeleted = (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
    setToast('Event deleted');
  };

  const isFullSidebar = user?.department === 'Leadership' || user?.department === "Writers' Block";

  return (
    <div className={`db-root${isDark ? ' dark' : ''}`}>
      <PageHeader
        pageTitle="Calendar"
        hideSearch={true}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[42px] bg-[var(--paper)] border-b border-[var(--rule)] z-40 p-4 space-y-4 max-h-[calc(100dvh-42px)] overflow-y-auto anim-fade-in">
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="db-cap block">View</span>
              <div className="grid grid-cols-1 gap-1">
                <button className="w-full text-xs text-left px-3 py-2 text-[var(--mid)] hover:bg-[var(--accent-sub)]">
                  Calendar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-[var(--rule)] pt-4">
              <button className="db-ghost justify-center text-xs py-2">
                Settings
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar
          activeNav="calendar"
          isFullSidebar={isFullSidebar}
          counts={counts}
        />

        <main className="db-main">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ height: 72, background: 'var(--accent-sub)', border: '1px solid var(--rule)', borderLeft: '2px solid var(--accent)', opacity: 0.6 + i * 0.1 }} />
              ))}
            </div>
          ) : (
            <Calendar
              events={events}
              onEventCreated={handleEventCreated}
              onEventUpdated={handleEventUpdated}
              onEventDeleted={handleEventDeleted}
            />
          )}
        </main>
      </div>

      <Suspense fallback={null}>
        <MobileNav activeNav="calendar" pendingTasksCount={counts.tasks} isFullSidebar={isFullSidebar} />
      </Suspense>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={
      <div className="app-bg flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-[1px] bg-[var(--accent)] animate-pulse" />
          <span className="db-cap text-[8px] tracking-[0.3em]" style={{ color: 'var(--mid)', letterSpacing: '0.3em' }}>LOADING CALENDAR</span>
        </div>
      </div>
    }>
      <CalendarPageContent />
    </Suspense>
  );
}