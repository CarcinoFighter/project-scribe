'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { CalendarEvent } from '@/types/calendar';
import { CalendarMonth } from './CalendarMonth';
import { CalendarWeek } from './CalendarWeek';
import { CalendarYear } from './CalendarYear';
import { CreateEventModal } from './CreateEventModal';
import { EventDetailModal } from './EventDetailModal';
import { getWeekDays } from '@/lib/calendar-utils';

type ViewMode = 'month' | 'week' | 'year';

interface CalendarProps {
  events: CalendarEvent[];
  onEventCreated: (event: CalendarEvent) => void;
  onEventUpdated?: (event: CalendarEvent) => void;
  onEventDeleted?: (eventId: string) => void;
}

export function Calendar({ events, onEventCreated, onEventUpdated, onEventDeleted }: CalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

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

  const handlePrevYear = () => {
    setCurrentDate(new Date(year - 1, month, 1));
  };

  const handleNextYear = () => {
    setCurrentDate(new Date(year + 1, month, 1));
  };

  const handleDayClick = (date: string) => {
    setSelectedDate(date);
    setShowCreateModal(true);
  };

  const handleMonthClick = (selectedMonth: number) => {
    setCurrentDate(new Date(year, selectedMonth, 1));
    setViewMode('month');
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
    if (viewMode === 'month') {
      return `${currentDate.toLocaleString('en-US', { month: 'long' })} ${year}`;
    }
    return year.toString();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header with controls */}
      <div className="db-rise-0" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <h1 className="db-page-title">{getHeaderTitle()}<em>.</em></h1>
          <p className="db-page-sub" style={{ marginTop: 6, textTransform: 'capitalize' }}>
            {viewMode} view · {events.length} event{events.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          className="db-btn"
          onClick={() => {
            setSelectedDate(null);
            setShowCreateModal(true);
          }}
        >
          <Plus size={10} strokeWidth={2.2} />
          New Event
        </button>
      </div>

      <hr className="db-triple-rule" />

      {/* View controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['month', 'week', 'year'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: '6px 12px',
                fontSize: 9,
                fontWeight: 700,
                border: '1px solid var(--rule)',
                background: viewMode === mode ? 'var(--accent)' : 'var(--paper)',
                color: viewMode === mode ? 'var(--paper)' : 'var(--ink)',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                transition: 'all 0.12s'
              }}
              onMouseEnter={(e) => {
                if (viewMode !== mode) {
                  (e.currentTarget as HTMLElement).style.background = 'var(--accent-sub)';
                }
              }}
              onMouseLeave={(e) => {
                if (viewMode !== mode) {
                  (e.currentTarget as HTMLElement).style.background = 'var(--paper)';
                }
              }}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="db-ghost"
            style={{ padding: '6px 10px', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}
          >
            Today
          </button>
          {viewMode === 'year' ? (
            <>
              <button
                onClick={handlePrevYear}
                className="db-ghost"
                style={{ padding: '6px 10px', display: 'flex', alignItems: 'center' }}
                title="Previous year"
              >
                <ChevronLeft size={12} strokeWidth={2} />
              </button>
              <button
                onClick={handleNextYear}
                className="db-ghost"
                style={{ padding: '6px 10px', display: 'flex', alignItems: 'center' }}
                title="Next year"
              >
                <ChevronRight size={12} strokeWidth={2} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handlePrevious}
                className="db-ghost"
                style={{ padding: '6px 10px', display: 'flex', alignItems: 'center' }}
                title={viewMode === 'week' ? 'Previous week' : 'Previous month'}
              >
                <ChevronLeft size={12} strokeWidth={2} />
              </button>
              <button
                onClick={handleNext}
                className="db-ghost"
                style={{ padding: '6px 10px', display: 'flex', alignItems: 'center' }}
                title={viewMode === 'week' ? 'Next week' : 'Next month'}
              >
                <ChevronRight size={12} strokeWidth={2} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Calendar views */}
      <div className="db-rise-1">
        {viewMode === 'month' && (
          <CalendarMonth
            year={year}
            month={month}
            events={events}
            onDayClick={handleDayClick}
            onEventClick={setSelectedEvent}
          />
        )}
        {viewMode === 'week' && (
          <CalendarWeek
            date={currentDate}
            events={events}
            onEventClick={setSelectedEvent}
          />
        )}
        {viewMode === 'year' && (
          <CalendarYear
            year={year}
            events={events}
            onMonthClick={handleMonthClick}
          />
        )}
      </div>

      {/* Create event modal */}
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

      {/* Event detail/edit modal */}
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