'use client';

import React from 'react';
import { getDaysInMonth } from '@/lib/calendar-utils';
import { CalendarEvent } from '@/types/calendar';
import { EventCard } from './EventCard';

interface CalendarMonthProps {
  year: number;
  month: number;
  events: CalendarEvent[];
  onDayClick?: (date: string) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

export function CalendarMonth({ year, month, events, onDayClick, onEventClick }: CalendarMonthProps) {
  const days = getDaysInMonth(year, month);

  const eventsByDate = events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
    if (!acc[event.date]) acc[event.date] = [];
    acc[event.date].push(event);
    return acc;
  }, {});

  const weekDayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Week day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
        {weekDayHeaders.map(day => (
          <div
            key={day}
            style={{
              padding: '12px 0',
              textAlign: 'center',
              fontSize: 9,
              fontFamily: 'var(--ff-mono)',
              fontWeight: 700,
              color: 'var(--mid)',
              letterSpacing: '0.1em',
              borderBottom: '1px solid var(--rule)',
              textTransform: 'uppercase'
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
        {days.map(day => {
          const dayEvents = eventsByDate[day.dateStr] || [];
          return (
            <div
              key={day.dateStr}
              onClick={() => onDayClick?.(day.dateStr)}
              style={{
                minHeight: '100px',
                padding: '8px',
                border: '1px solid var(--rule)',
                borderLeft: day.dayOfWeek === 0 ? '2px solid var(--rule)' : '1px solid var(--rule)',
                background: day.isToday ? 'var(--accent-sub)' : day.isCurrentMonth ? 'var(--paper)' : 'var(--accent-sub)',
                opacity: day.isCurrentMonth ? 1 : 0.5,
                cursor: 'pointer',
                transition: 'all 0.12s',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'var(--accent-sub)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = day.isToday ? 'var(--accent-sub)' : day.isCurrentMonth ? 'var(--paper)' : 'var(--accent-sub)';
              }}
            >
              {/* Day number */}
              <div style={{
                fontSize: 12,
                fontWeight: day.isToday ? 700 : 600,
                color: day.isToday ? 'var(--accent)' : 'var(--ink)',
              }}>
                {day.date.getDate()}
              </div>

              {/* Event indicators */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
                {dayEvents.slice(0, 2).map(event => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                    style={{
                      fontSize: 7,
                      padding: '2px 4px',
                      background: 'var(--accent)',
                      color: 'var(--paper)',
                      fontWeight: 700,
                      borderRadius: '2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer'
                    }}
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div style={{
                    fontSize: 7,
                    color: 'var(--accent)',
                    fontWeight: 700,
                    letterSpacing: '0.05em'
                  }}>
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
