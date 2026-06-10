'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Search, Filter, LayoutGrid, Calendar as CalIcon, List, CalendarDays } from 'lucide-react';
import { CalendarEvent } from '@/types/calendar';
import { CalendarMonth } from './CalendarMonth';
import { CalendarWeek } from './CalendarWeek';
import { CalendarYear } from './CalendarYear';
import { CalendarAgenda } from './CalendarAgenda';
import { CreateEventModal } from './CreateEventModal';
import { EventDetailModal } from './EventDetailModal';
import { getWeekDays, getDaysInMonth, formatDateToISO } from '@/lib/calendar-utils';
import { DEPARTMENTS } from '@/config/departments';

type ViewMode = 'month' | 'week' | 'year' | 'agenda';

interface CalendarProps {
  events: CalendarEvent[];
  onEventCreated: (event: CalendarEvent) => void;
  onEventUpdated?: (event: CalendarEvent) => void;
  onEventDeleted?: (eventId: string) => void;
}

const VIEW_ICONS: Record<ViewMode, React.ReactNode> = {
  month: <LayoutGrid size={11} strokeWidth={2} />,
  week: <CalendarDays size={11} strokeWidth={2} />,
  year: <CalIcon size={11} strokeWidth={2} />,
  agenda: <List size={11} strokeWidth={2} />,
};

function MiniSidebarCalendar({
  currentDate,
  onSelectDate,
  events,
}: {
  currentDate: Date;
  onSelectDate: (date: Date) => void;
  events: CalendarEvent[];
}) {
  const [miniDate, setMiniDate] = useState(() => new Date(currentDate));
  const year = miniDate.getFullYear();
  const month = miniDate.getMonth();
  const days = getDaysInMonth(year, month);

  const eventDates = useMemo(() => {
    const s = new Set<string>();
    events.forEach(e => s.add(e.date));
    return s;
  }, [events]);

  const todayStr = formatDateToISO(new Date());
  const selectedStr = formatDateToISO(currentDate);

  return (
    <div style={{ padding: '16px 14px', borderBottom: '1px solid var(--rule)' }}>
      {/* Mini header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button
          onClick={() => setMiniDate(new Date(year, month - 1, 1))}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mid)', padding: 2, display: 'flex' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--mid)')}
        >
          <ChevronLeft size={11} strokeWidth={2} />
        </button>
        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--ff-mono)' }}>
          {miniDate.toLocaleString('en-US', { month: 'short' })} {year}
        </span>
        <button
          onClick={() => setMiniDate(new Date(year, month + 1, 1))}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mid)', padding: 2, display: 'flex' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--mid)')}
        >
          <ChevronRight size={11} strokeWidth={2} />
        </button>
      </div>
      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, marginBottom: 4 }}>
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 7, fontWeight: 700, color: 'var(--mid)', letterSpacing: '0.06em', fontFamily: 'var(--ff-mono)', padding: '2px 0' }}>{d}</div>
        ))}
      </div>
      {/* Days */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
        {days.map(day => {
          const isSelected = day.dateStr === selectedStr;
          const isToday = day.dateStr === todayStr;
          const hasEvent = eventDates.has(day.dateStr);
          return (
            <div
              key={day.dateStr}
              onClick={() => {
                onSelectDate(day.date);
                setMiniDate(new Date(day.date.getFullYear(), day.date.getMonth(), 1));
              }}
              style={{
                textAlign: 'center',
                fontSize: 8,
                padding: '3px 1px',
                cursor: 'pointer',
                position: 'relative',
                background: isSelected ? 'var(--accent)' : isToday ? 'var(--accent-sub)' : 'transparent',
                color: isSelected ? 'var(--paper)' : !day.isCurrentMonth ? 'var(--mid)' : isToday ? 'var(--accent)' : 'var(--ink)',
                fontWeight: isToday || isSelected ? 700 : 400,
                opacity: !day.isCurrentMonth ? 0.4 : 1,
                transition: 'all 0.1s',
              }}
              onMouseEnter={e => {
                if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--accent-sub)';
              }}
              onMouseLeave={e => {
                if (!isSelected) (e.currentTarget as HTMLElement).style.background = isToday ? 'var(--accent-sub)' : 'transparent';
              }}
            >
              {day.date.getDate()}
              {hasEvent && !isSelected && (
                <div style={{
                  position: 'absolute', bottom: 1, left: '50%', transform: 'translateX(-50%)',
                  width: 3, height: 3, borderRadius: '50%', background: 'var(--accent)',
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Calendar({ events, onEventCreated, onEventUpdated, onEventDeleted }: CalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Filter events
  const filteredEvents = useMemo(() => {
    let result = events;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q) ||
        e.department?.toLowerCase().includes(q)
      );
    }
    if (activeFilters.size > 0) {
      result = result.filter(e => {
        if (activeFilters.has('tasks') && e.id.startsWith('task-')) return true;
        if (e.department && activeFilters.has(e.department)) return true;
        return false;
      });
    }
    return result;
  }, [events, search, activeFilters]);

  const handlePrevious = () => {
    if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else if (viewMode === 'agenda') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      setCurrentDate(new Date(year, month - 1, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else if (viewMode === 'agenda') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else {
      setCurrentDate(new Date(year, month + 1, 1));
    }
  };

  const handlePrevYear = () => setCurrentDate(new Date(year - 1, month, 1));
  const handleNextYear = () => setCurrentDate(new Date(year + 1, month, 1));

  const handleDayClick = (date: string) => {
    setSelectedDate(date);
    setShowCreateModal(true);
  };

  const handleMonthClick = (selectedMonth: number) => {
    setCurrentDate(new Date(year, selectedMonth, 1));
    setViewMode('month');
  };

  const handleMiniCalendarSelect = (date: Date) => {
    setCurrentDate(date);
    if (viewMode === 'year') setViewMode('month');
  };

  const getHeaderTitle = () => {
    if (viewMode === 'week') {
      const weekDays = getWeekDays(currentDate);
      const first = weekDays[0].date;
      const last = weekDays[6].date;
      if (first.getMonth() === last.getMonth()) {
        return `${first.toLocaleString('en-US', { month: 'long' })} ${first.getFullYear()}`;
      }
      return `${first.toLocaleString('en-US', { month: 'short' })} – ${last.toLocaleString('en-US', { month: 'short' })} ${last.getFullYear()}`;
    }
    if (viewMode === 'month' || viewMode === 'agenda') {
      return `${currentDate.toLocaleString('en-US', { month: 'long' })} ${year}`;
    }
    return year.toString();
  };

  const toggleFilter = (key: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const todayEventCount = useMemo(() => {
    const todayStr = formatDateToISO(new Date());
    return filteredEvents.filter(e => e.date === todayStr).length;
  }, [filteredEvents]);

  const upcomingCount = useMemo(() => {
    const now = new Date();
    return filteredEvents.filter(e => new Date(`${e.date}T${e.time}`) >= now).length;
  }, [filteredEvents]);

  return (
    <div style={{ display: 'flex', gap: 0, minHeight: 0 }}>
      {/* Left sidebar */}
      <div style={{
        width: 180,
        flexShrink: 0,
        borderRight: '1px solid var(--rule)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--cream)',
        marginLeft: -20,
        marginTop: -20,
        marginBottom: -20,
        paddingTop: 20,
        minHeight: 'calc(100vh - 80px)',
      }}
      className="hidden md:flex"
      >
        <MiniSidebarCalendar
          currentDate={currentDate}
          onSelectDate={handleMiniCalendarSelect}
          events={filteredEvents}
        />

        {/* Quick stats */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--rule)' }}>
          <div style={{ fontSize: 7, fontWeight: 700, color: 'var(--mid)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'var(--ff-mono)' }}>
            Overview
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 8, color: 'var(--mid)' }}>Today</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: todayEventCount > 0 ? 'var(--accent)' : 'var(--mid)', fontFamily: 'var(--ff-mono)' }}>{todayEventCount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 8, color: 'var(--mid)' }}>Upcoming</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--ff-mono)' }}>{upcomingCount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 8, color: 'var(--mid)' }}>Total</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--ff-mono)' }}>{events.length}</span>
            </div>
          </div>
        </div>

        {/* View selector in sidebar */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--rule)' }}>
          <div style={{ fontSize: 7, fontWeight: 700, color: 'var(--mid)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'var(--ff-mono)' }}>
            View
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {(['month', 'week', 'agenda', 'year'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 8px',
                  background: viewMode === mode ? 'var(--accent-sub)' : 'transparent',
                  border: viewMode === mode ? '1px solid var(--accent)' : '1px solid transparent',
                  color: viewMode === mode ? 'var(--accent)' : 'var(--mid)',
                  cursor: 'pointer',
                  fontSize: 9,
                  fontWeight: viewMode === mode ? 700 : 500,
                  textTransform: 'capitalize',
                  textAlign: 'left',
                  transition: 'all 0.1s',
                }}
                onMouseEnter={e => {
                  if (viewMode !== mode) {
                    (e.currentTarget as HTMLElement).style.background = 'var(--accent-sub)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--ink)';
                  }
                }}
                onMouseLeave={e => {
                  if (viewMode !== mode) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = 'var(--mid)';
                  }
                }}
              >
                {VIEW_ICONS[mode]}
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Department filters */}
        <div style={{ padding: '12px 14px', flex: 1 }}>
          <div style={{ fontSize: 7, fontWeight: 700, color: 'var(--mid)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'var(--ff-mono)' }}>
            Filter
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Tasks filter */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', padding: '4px 0' }}>
              <div
                style={{
                  width: 11, height: 11, border: `1.5px solid var(--accent)`,
                  background: activeFilters.has('tasks') ? 'var(--accent)' : 'transparent',
                  flexShrink: 0, cursor: 'pointer', transition: 'all 0.1s',
                }}
                onClick={() => toggleFilter('tasks')}
              />
              <span style={{ fontSize: 8, color: 'var(--mid)' }}>Tasks</span>
              <span style={{ marginLeft: 'auto', fontSize: 7, fontFamily: 'var(--ff-mono)', color: 'var(--mid)' }}>
                {events.filter(e => e.id.startsWith('task-')).length}
              </span>
            </label>
            {DEPARTMENTS.map(dept => {
              const colorMap: Record<string, string> = {
                "Leadership": "#6366f1",
                "Writers' Block": "#f59e0b",
                "Design Lab": "#3b82f6",
                "Development": "#10b981",
                "Marketing": "#ec4899",
              };
              const color = colorMap[dept.key] || 'var(--mid)';
              const count = events.filter(e => e.department === dept.key).length;
              return (
                <label key={dept.key} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', padding: '4px 0' }}>
                  <div
                    style={{
                      width: 11, height: 11, border: `1.5px solid ${color}`,
                      background: activeFilters.has(dept.key) ? color : 'transparent',
                      flexShrink: 0, cursor: 'pointer', transition: 'all 0.1s',
                    }}
                    onClick={() => toggleFilter(dept.key)}
                  />
                  <span style={{ fontSize: 8, color: 'var(--mid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dept.label}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 7, fontFamily: 'var(--ff-mono)', color: 'var(--mid)', flexShrink: 0 }}>{count}</span>
                </label>
              );
            })}
            {activeFilters.size > 0 && (
              <button
                onClick={() => setActiveFilters(new Set())}
                style={{
                  marginTop: 6, padding: '4px 0', background: 'none', border: 'none',
                  fontSize: 7, color: 'var(--accent)', cursor: 'pointer',
                  textAlign: 'left', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700,
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* New event button */}
        <div style={{ padding: '14px', borderTop: '1px solid var(--rule)' }}>
          <button
            className="db-btn"
            onClick={() => { setSelectedDate(null); setShowCreateModal(true); }}
            style={{ width: '100%', justifyContent: 'center', fontSize: 9 }}
          >
            <Plus size={10} strokeWidth={2.5} />
            New Event
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Header */}
        <div className="db-rise-0" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h1 className="db-page-title">{getHeaderTitle()}<em>.</em></h1>
            <p className="db-page-sub" style={{ marginTop: 4 }}>
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
              {activeFilters.size > 0 ? ` · ${activeFilters.size} filter${activeFilters.size > 1 ? 's' : ''} active` : ''}
              {search ? ` · "${search}"` : ''}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Search */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={10} style={{ position: 'absolute', left: 8, color: 'var(--mid)', pointerEvents: 'none' }} strokeWidth={2} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search events…"
                style={{
                  paddingLeft: 24, paddingRight: 10, paddingTop: 6, paddingBottom: 6,
                  border: '1px solid var(--rule)',
                  background: 'var(--cream)',
                  color: 'var(--ink)',
                  fontSize: 9,
                  outline: 'none',
                  width: 160,
                  fontFamily: 'var(--ff-ui)',
                  letterSpacing: '0.02em',
                  transition: 'border-color 0.12s',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--rule)')}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mid)', fontSize: 10, padding: 0, lineHeight: 1 }}
                >
                  ×
                </button>
              )}
            </div>

            {/* Today button */}
            <button
              onClick={() => setCurrentDate(new Date())}
              className="db-ghost"
              style={{ padding: '6px 12px', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}
            >
              Today
            </button>

            {/* Prev/Next */}
            {viewMode === 'year' ? (
              <>
                <button onClick={handlePrevYear} className="db-ghost" style={{ padding: '6px 8px', display: 'flex', alignItems: 'center' }}>
                  <ChevronLeft size={12} strokeWidth={2} />
                </button>
                <button onClick={handleNextYear} className="db-ghost" style={{ padding: '6px 8px', display: 'flex', alignItems: 'center' }}>
                  <ChevronRight size={12} strokeWidth={2} />
                </button>
              </>
            ) : (
              <>
                <button onClick={handlePrevious} className="db-ghost" style={{ padding: '6px 8px', display: 'flex', alignItems: 'center' }}>
                  <ChevronLeft size={12} strokeWidth={2} />
                </button>
                <button onClick={handleNext} className="db-ghost" style={{ padding: '6px 8px', display: 'flex', alignItems: 'center' }}>
                  <ChevronRight size={12} strokeWidth={2} />
                </button>
              </>
            )}

            {/* Mobile: New event */}
            <button
              className="db-btn md:hidden"
              onClick={() => { setSelectedDate(null); setShowCreateModal(true); }}
            >
              <Plus size={10} strokeWidth={2.5} />
              New
            </button>
          </div>
        </div>

        <hr className="db-triple-rule" />

        {/* Mobile view tabs */}
        <div className="flex md:hidden" style={{ gap: 4 }}>
          {(['month', 'week', 'agenda', 'year'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: '5px 10px', fontSize: 8, fontWeight: 700,
                border: '1px solid var(--rule)',
                background: viewMode === mode ? 'var(--accent)' : 'var(--paper)',
                color: viewMode === mode ? 'var(--paper)' : 'var(--ink)',
                cursor: 'pointer', textTransform: 'capitalize', letterSpacing: '0.06em',
              }}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Calendar views */}
        <div className="db-rise-1">
          {viewMode === 'month' && (
            <CalendarMonth
              year={year}
              month={month}
              events={filteredEvents}
              onDayClick={handleDayClick}
              onEventClick={setSelectedEvent}
              highlightToday
            />
          )}
          {viewMode === 'week' && (
            <CalendarWeek
              date={currentDate}
              events={filteredEvents}
              onEventClick={setSelectedEvent}
              onDayClick={handleDayClick}
            />
          )}
          {viewMode === 'year' && (
            <CalendarYear
              year={year}
              events={filteredEvents}
              onMonthClick={handleMonthClick}
            />
          )}
          {viewMode === 'agenda' && (
            <CalendarAgenda
              date={currentDate}
              events={filteredEvents}
              onEventClick={setSelectedEvent}
              onDayClick={handleDayClick}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateEventModal
          initialDate={selectedDate || undefined}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(event) => {
            onEventCreated(event);
            setShowCreateModal(false);
          }}
        />
      )}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onUpdated={(updated) => {
            onEventUpdated?.(updated);
            setSelectedEvent(null);
          }}
          onDeleted={(id) => {
            onEventDeleted?.(id);
            setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
}
