'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Search, LayoutGrid, Calendar as CalIcon, List, CalendarDays, X } from 'lucide-react';
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

const VIEW_CONFIG: Record<ViewMode, { icon: React.ReactNode; label: string }> = {
  month: { icon: <LayoutGrid size={13} strokeWidth={1.75} />, label: 'Month' },
  week: { icon: <CalendarDays size={13} strokeWidth={1.75} />, label: 'Week' },
  year: { icon: <CalIcon size={13} strokeWidth={1.75} />, label: 'Year' },
  agenda: { icon: <List size={13} strokeWidth={1.75} />, label: 'Agenda' },
};

const DEPT_COLORS: Record<string, string> = {
  'Leadership': '#6366f1',
  "Writers' Block": '#f59e0b',
  'Design Lab': '#3b82f6',
  'Development': '#10b981',
  'Marketing': '#ec4899',
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
    <div className="cal-mini-calendar">
      <div className="cal-mini-header">
        <button
          className="db-icon-btn"
          style={{ width: 20, height: 20 }}
          onClick={() => setMiniDate(new Date(year, month - 1, 1))}
        >
          <ChevronLeft size={10} strokeWidth={2} />
        </button>
        <span className="cal-mini-month-label">
          {miniDate.toLocaleString('en-US', { month: 'short' })} {year}
        </span>
        <button
          className="db-icon-btn"
          style={{ width: 20, height: 20 }}
          onClick={() => setMiniDate(new Date(year, month + 1, 1))}
        >
          <ChevronRight size={10} strokeWidth={2} />
        </button>
      </div>

      <div className="cal-mini-grid">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} className="cal-mini-dow">{d}</div>
        ))}
        {days.map(day => {
          const isSelected = day.dateStr === selectedStr;
          const isToday = day.dateStr === todayStr;
          const hasEvent = eventDates.has(day.dateStr);
          return (
            <button
              key={day.dateStr}
              onClick={() => {
                onSelectDate(day.date);
                setMiniDate(new Date(day.date.getFullYear(), day.date.getMonth(), 1));
              }}
              className={`cal-mini-day${isSelected ? ' selected' : isToday ? ' today' : ''}${!day.isCurrentMonth ? ' other-month' : ''}`}
            >
              {day.date.getDate()}
              {hasEvent && !isSelected && <span className="cal-mini-dot" />}
            </button>
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

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

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
    } else {
      setCurrentDate(new Date(year, month - 1, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
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
    <>
      {/* ── Inject calendar-specific styles ── */}
      <style>{`
        .cal-layout { display: flex; min-height: 0; }

        /* ── Sidebar ── */
        .cal-sidebar {
          width: 192px;
          flex-shrink: 0;
          border-right: 1px solid var(--rule);
          display: flex;
          flex-direction: column;
          background: color-mix(in srgb, var(--paper) 97%, var(--accent) 3%);
          margin-left: -20px;
          margin-top: -20px;
          margin-bottom: -20px;
          padding-top: 20px;
          min-height: calc(100vh - 80px);
        }

        .cal-sidebar-section {
          padding: 14px 16px;
          border-bottom: 1px solid var(--rule);
        }
        .cal-sidebar-section:last-child { border-bottom: none; }

        .cal-sidebar-label {
          font-family: var(--ff-mono);
          font-size: 8.5px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--mid);
          opacity: 0.65;
          margin-bottom: 10px;
        }

        /* ── Mini calendar ── */
        .cal-mini-calendar { padding: 14px 16px; border-bottom: 1px solid var(--rule); }

        .cal-mini-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .cal-mini-month-label {
          font-family: var(--ff-mono);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--ink);
        }

        .cal-mini-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
        }

        .cal-mini-dow {
          text-align: center;
          font-family: var(--ff-mono);
          font-size: 7px;
          font-weight: 700;
          color: var(--mid);
          letter-spacing: 0.06em;
          padding: 3px 0 4px;
        }

        .cal-mini-day {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8.5px;
          font-weight: 400;
          color: var(--ink);
          cursor: pointer;
          background: transparent;
          border: none;
          border-radius: var(--r-xs);
          padding: 3px 1px;
          transition: background 0.1s, color 0.1s;
          font-family: var(--ff-ui);
        }

        .cal-mini-day:hover { background: var(--accent-dim); color: var(--accent); }
        .cal-mini-day.today { background: var(--accent-sub); color: var(--accent); font-weight: 700; }
        .cal-mini-day.selected { background: var(--accent); color: white; font-weight: 700; }
        .cal-mini-day.selected:hover { background: var(--accent-hover); }
        .cal-mini-day.other-month { opacity: 0.3; }

        .cal-mini-dot {
          position: absolute;
          bottom: 1px;
          left: 50%;
          transform: translateX(-50%);
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: var(--accent);
        }

        /* ── Overview stats ── */
        .cal-stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 0;
        }
        .cal-stat-label {
          font-size: 9px;
          color: var(--mid);
          font-family: var(--ff-ui);
        }
        .cal-stat-value {
          font-size: 11px;
          font-weight: 700;
          font-family: var(--ff-mono);
          color: var(--ink);
        }
        .cal-stat-value.accent { color: var(--accent); }

        /* ── View selector ── */
        .cal-view-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 7px 10px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: var(--r-sm);
          color: var(--mid);
          cursor: pointer;
          font-size: 10px;
          font-family: var(--ff-ui);
          font-weight: 500;
          text-align: left;
          text-transform: capitalize;
          transition: all 0.12s;
          letter-spacing: 0.04em;
        }
        .cal-view-btn:hover { background: var(--accent-dim); color: var(--ink); border-color: transparent; }
        .cal-view-btn.active {
          background: var(--accent-sub);
          border-color: color-mix(in srgb, var(--accent) 40%, transparent);
          color: var(--accent);
          font-weight: 650;
        }

        /* ── Filter checkboxes ── */
        .cal-filter-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 0;
          cursor: pointer;
        }
        .cal-filter-chip {
          width: 10px;
          height: 10px;
          border-radius: 2px;
          border: 1.5px solid;
          flex-shrink: 0;
          transition: background 0.1s;
        }
        .cal-filter-name {
          font-size: 9px;
          color: var(--mid);
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-family: var(--ff-ui);
        }
        .cal-filter-count {
          font-size: 8px;
          font-family: var(--ff-mono);
          color: var(--mid);
          flex-shrink: 0;
          opacity: 0.6;
        }

        /* ── Main ── */
        .cal-main {
          flex: 1;
          min-width: 0;
          padding-left: 28px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        /* ── Toolbar ── */
        .cal-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .cal-title-group { display: flex; flex-direction: column; gap: 2px; }

        .cal-nav-cluster {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* ── Search input ── */
        .cal-search-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .cal-search-icon {
          position: absolute;
          left: 9px;
          color: var(--mid);
          pointer-events: none;
          display: flex;
        }
        .cal-search-input {
          padding: 6px 28px 6px 28px;
          border: 1px solid var(--rule);
          border-radius: var(--r-md);
          background: var(--cream);
          color: var(--ink);
          font-size: 10px;
          font-family: var(--ff-ui);
          outline: none;
          width: 164px;
          transition: border-color 0.12s, box-shadow 0.12s;
          letter-spacing: 0.02em;
        }
        .cal-search-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 2px var(--accent-dim);
        }
        .cal-search-input::placeholder { color: var(--mid); opacity: 0.7; }
        .cal-search-clear {
          position: absolute;
          right: 8px;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--mid);
          display: flex;
          align-items: center;
          padding: 0;
          line-height: 1;
          transition: color 0.1s;
        }
        .cal-search-clear:hover { color: var(--ink); }

        /* ── Mobile view tabs ── */
        .cal-mobile-tabs {
          display: flex;
          gap: 4px;
          padding: 4px;
          background: var(--cream);
          border-radius: var(--r-md);
          border: 1px solid var(--rule);
        }
        .cal-mobile-tab {
          flex: 1;
          padding: 5px 0;
          font-size: 9px;
          font-weight: 600;
          border: none;
          border-radius: var(--r-sm);
          background: transparent;
          color: var(--mid);
          cursor: pointer;
          text-transform: capitalize;
          letter-spacing: 0.06em;
          font-family: var(--ff-ui);
          transition: all 0.12s;
        }
        .cal-mobile-tab.active {
          background: var(--accent);
          color: white;
        }
      `}</style>

      <div className="cal-layout">
        {/* ── Left sidebar ── */}
        <div className="cal-sidebar hidden md:flex" style={{ flexDirection: 'column' }}>
          <MiniSidebarCalendar
            currentDate={currentDate}
            onSelectDate={handleMiniCalendarSelect}
            events={filteredEvents}
          />

          {/* Overview stats */}
          <div className="cal-sidebar-section">
            <div className="cal-sidebar-label">Overview</div>
            <div className="cal-stat-row">
              <span className="cal-stat-label">Today</span>
              <span className={`cal-stat-value${todayEventCount > 0 ? ' accent' : ''}`}>{todayEventCount}</span>
            </div>
            <div className="cal-stat-row">
              <span className="cal-stat-label">Upcoming</span>
              <span className="cal-stat-value">{upcomingCount}</span>
            </div>
            <div className="cal-stat-row">
              <span className="cal-stat-label">Total</span>
              <span className="cal-stat-value">{events.length}</span>
            </div>
          </div>

          {/* View selector */}
          <div className="cal-sidebar-section">
            <div className="cal-sidebar-label">View</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {(['month', 'week', 'agenda', 'year'] as ViewMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`cal-view-btn${viewMode === mode ? ' active' : ''}`}
                >
                  {VIEW_CONFIG[mode].icon}
                  {VIEW_CONFIG[mode].label}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="cal-sidebar-section" style={{ flex: 1 }}>
            <div className="cal-sidebar-label">Filter</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div className="cal-filter-row" onClick={() => toggleFilter('tasks')}>
                <div
                  className="cal-filter-chip"
                  style={{
                    borderColor: 'var(--accent)',
                    background: activeFilters.has('tasks') ? 'var(--accent)' : 'transparent',
                  }}
                />
                <span className="cal-filter-name">Tasks</span>
                <span className="cal-filter-count">{events.filter(e => e.id.startsWith('task-')).length}</span>
              </div>
              {DEPARTMENTS.map(dept => {
                const color = DEPT_COLORS[dept.key] || 'var(--mid)';
                const count = events.filter(e => e.department === dept.key).length;
                return (
                  <div key={dept.key} className="cal-filter-row" onClick={() => toggleFilter(dept.key)}>
                    <div
                      className="cal-filter-chip"
                      style={{
                        borderColor: color,
                        background: activeFilters.has(dept.key) ? color : 'transparent',
                      }}
                    />
                    <span className="cal-filter-name">{dept.label}</span>
                    <span className="cal-filter-count">{count}</span>
                  </div>
                );
              })}
              {activeFilters.size > 0 && (
                <button
                  onClick={() => setActiveFilters(new Set())}
                  style={{
                    marginTop: 8,
                    padding: '4px 0',
                    background: 'none',
                    border: 'none',
                    fontSize: 8,
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    fontFamily: 'var(--ff-mono)',
                  }}
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* New event */}
          <div className="cal-sidebar-section">
            <button
              className="db-btn"
              onClick={() => { setSelectedDate(null); setShowCreateModal(true); }}
              style={{ width: '100%', justifyContent: 'center', fontSize: 10, padding: '8px 14px' }}
            >
              <Plus size={11} strokeWidth={2.5} />
              New Event
            </button>
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="cal-main">
          {/* Toolbar */}
          <div className="cal-toolbar db-rise-0">
            <div className="cal-title-group">
              <h1 className="db-page-title">{getHeaderTitle()}<em>.</em></h1>
              <p className="db-page-sub" style={{ marginTop: 2 }}>
                {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
                {activeFilters.size > 0 ? ` · ${activeFilters.size} filter${activeFilters.size > 1 ? 's' : ''} active` : ''}
                {search ? ` · "${search}"` : ''}
              </p>
            </div>

            <div className="cal-nav-cluster">
              {/* Search */}
              <div className="cal-search-wrap">
                <span className="cal-search-icon"><Search size={11} strokeWidth={2} /></span>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search events…"
                  className="cal-search-input"
                />
                {search && (
                  <button className="cal-search-clear" onClick={() => setSearch('')}>
                    <X size={10} strokeWidth={2.5} />
                  </button>
                )}
              </div>

              {/* Today */}
              <button
                onClick={() => setCurrentDate(new Date())}
                className="db-ghost"
                style={{ padding: '6px 12px', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}
              >
                Today
              </button>

              {/* Prev / Next */}
              {viewMode === 'year' ? (
                <>
                  <button onClick={handlePrevYear} className="db-icon-btn"><ChevronLeft size={13} strokeWidth={2} /></button>
                  <button onClick={handleNextYear} className="db-icon-btn"><ChevronRight size={13} strokeWidth={2} /></button>
                </>
              ) : (
                <>
                  <button onClick={handlePrevious} className="db-icon-btn"><ChevronLeft size={13} strokeWidth={2} /></button>
                  <button onClick={handleNext} className="db-icon-btn"><ChevronRight size={13} strokeWidth={2} /></button>
                </>
              )}

              {/* Mobile: new event */}
              <button
                className="db-btn md:hidden"
                onClick={() => { setSelectedDate(null); setShowCreateModal(true); }}
                style={{ padding: '6px 12px', fontSize: 10 }}
              >
                <Plus size={11} strokeWidth={2.5} />
                New
              </button>
            </div>
          </div>

          <hr className="db-triple-rule" />

          {/* Mobile view tabs */}
          <div className="cal-mobile-tabs md:hidden">
            {(['month', 'week', 'agenda', 'year'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`cal-mobile-tab${viewMode === mode ? ' active' : ''}`}
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
    </>
  );
}
