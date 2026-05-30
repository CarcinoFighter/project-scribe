'use client';

import React from 'react';
import { getYearMonths, getDaysInMonth } from '@/lib/calendar-utils';
import { CalendarEvent } from '@/types/calendar';

interface CalendarYearProps {
  year: number;
  events: CalendarEvent[];
  onMonthClick?: (month: number) => void;
}

export function CalendarYear({ year, events, onMonthClick }: CalendarYearProps) {
  const months = getYearMonths(year);

  const eventCountByMonth = events.reduce<Record<number, number>>((acc, event) => {
    const eventDate = new Date(event.date);
    const month = eventDate.getMonth();
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
      {months.map(month => {
        const days = getDaysInMonth(year, month.month);
        const eventCount = eventCountByMonth[month.month] || 0;

        return (
          <div
            key={month.month}
            onClick={() => onMonthClick?.(month.month)}
            style={{
              border: '1px solid var(--rule)',
              background: 'var(--paper)',
              cursor: 'pointer',
              transition: 'all 0.15s',
              padding: '14px'
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--accent-sub)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--paper)';
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
          >
            {/* Month header */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>
                {month.monthName}
              </div>
              {eventCount > 0 && (
                <div style={{
                  fontSize: 8,
                  padding: '2px 6px',
                  background: 'var(--accent)',
                  color: 'var(--paper)',
                  fontWeight: 700,
                  display: 'inline-block',
                  borderRadius: '2px',
                  letterSpacing: '0.05em'
                }}>
                  {eventCount} event{eventCount > 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Mini calendar grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
              {/* Day headers */}
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                <div key={day} style={{
                  fontSize: 7,
                  fontWeight: 700,
                  color: 'var(--mid)',
                  textAlign: 'center',
                  padding: '4px 2px',
                  borderBottom: '1px solid var(--rule)'
                }}>
                  {day}
                </div>
              ))}

              {/* Days */}
              {days.map(day => (
                <div
                  key={day.dateStr}
                  style={{
                    fontSize: 7,
                    padding: '4px 2px',
                    textAlign: 'center',
                    color: day.isCurrentMonth ? 'var(--ink)' : 'var(--mid)',
                    opacity: day.isCurrentMonth ? 1 : 0.4,
                    background: day.isToday ? 'var(--accent)' : 'transparent',
                    color: day.isToday ? 'var(--paper)' : day.isCurrentMonth ? 'var(--ink)' : 'var(--mid)',
                    fontWeight: day.isToday ? 700 : 400
                  }}
                >
                  {day.date.getDate()}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
