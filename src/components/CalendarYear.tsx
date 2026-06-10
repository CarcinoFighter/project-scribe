'use client';

import React from 'react';
import { getYearMonths, getDaysInMonth, getEventColor, formatDateToISO } from '@/lib/calendar-utils';
import { CalendarEvent } from '@/types/calendar';

interface CalendarYearProps {
  year: number;
  events: CalendarEvent[];
  onMonthClick?: (month: number) => void;
}

export function CalendarYear({ year, events, onMonthClick }: CalendarYearProps) {
  const months = getYearMonths(year);
  const todayStr = formatDateToISO(new Date());

  // Build a map of date → events for heat map dots
  const eventsByDate = events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
    if (!acc[event.date]) acc[event.date] = [];
    acc[event.date].push(event);
    return acc;
  }, {});

  const eventCountByMonth = events.reduce<Record<number, number>>((acc, event) => {
    const d = new Date(event.date + 'T00:00:00');
    if (d.getFullYear() === year) {
      const m = d.getMonth();
      acc[m] = (acc[m] || 0) + 1;
    }
    return acc;
  }, {});

  const maxMonthEvents = Math.max(1, ...Object.values(eventCountByMonth));

  // Department colors for the year overview bar
  const colorMap: Record<string, string> = {
    "Leadership": "#6366f1",
    "Writers' Block": "#f59e0b",
    "Design Lab": "#3b82f6",
    "Development": "#10b981",
    "Marketing": "#ec4899",
  };

  const deptCountsByMonth = events.reduce<Record<number, Record<string, number>>>((acc, event) => {
    const d = new Date(event.date + 'T00:00:00');
    if (d.getFullYear() === year && event.department) {
      const m = d.getMonth();
      if (!acc[m]) acc[m] = {};
      acc[m][event.department] = (acc[m][event.department] || 0) + 1;
    }
    return acc;
  }, {});

  const currentMonth = new Date().getMonth();

  return (
    <div>
      {/* Year activity heatmap header */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)',
        gap: 2, marginBottom: 20,
        border: '1px solid var(--rule)', padding: '12px',
        background: 'var(--cream)',
      }}>
        {months.map(m => {
          const count = eventCountByMonth[m.month] || 0;
          const intensity = count / maxMonthEvents;
          return (
            <div
              key={m.month}
              onClick={() => onMonthClick?.(m.month)}
              style={{ cursor: 'pointer' }}
              title={`${m.monthName}: ${count} event${count !== 1 ? 's' : ''}`}
            >
              <div style={{ fontSize: 7, color: 'var(--mid)', textAlign: 'center', marginBottom: 4, fontFamily: 'var(--ff-mono)', letterSpacing: '0.06em' }}>
                {m.monthName.slice(0, 1)}
              </div>
              <div style={{
                height: 32,
                background: count > 0
                  ? `rgba(152,117,193,${0.15 + intensity * 0.65})`
                  : 'rgba(255,255,255,0.04)',
                border: m.month === currentMonth ? '1px solid var(--accent)' : '1px solid transparent',
                transition: 'all 0.1s',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.filter = 'brightness(1.3)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.filter = 'none'}
              />
              {count > 0 && (
                <div style={{ fontSize: 6, color: 'var(--mid)', textAlign: 'center', marginTop: 3, fontFamily: 'var(--ff-mono)' }}>
                  {count}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Month grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        {months.map(month => {
          const days = getDaysInMonth(year, month.month);
          const eventCount = eventCountByMonth[month.month] || 0;
          const deptCounts = deptCountsByMonth[month.month] || {};
          const isCurrentMonth = month.month === currentMonth && year === new Date().getFullYear();

          return (
            <div
              key={month.month}
              onClick={() => onMonthClick?.(month.month)}
              style={{
                border: isCurrentMonth ? '1px solid var(--accent)' : '1px solid var(--rule)',
                background: 'var(--paper)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                padding: '12px',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'var(--accent-sub)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'var(--paper)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              {/* Month header */}
              <div style={{ marginBottom: 10, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{
                    fontSize: 11, fontWeight: 700,
                    color: isCurrentMonth ? 'var(--accent)' : 'var(--ink)',
                    marginBottom: 4,
                  }}>
                    {month.monthName}
                  </div>
                  {eventCount > 0 && (
                    <div style={{
                      fontSize: 7,
                      color: 'var(--mid)',
                      fontFamily: 'var(--ff-mono)',
                    }}>
                      {eventCount} event{eventCount !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                {/* Department color strips */}
                {Object.keys(deptCounts).length > 0 && (
                  <div style={{ display: 'flex', gap: 2 }}>
                    {Object.entries(deptCounts).slice(0, 4).map(([dept]) => (
                      <div
                        key={dept}
                        style={{
                          width: 3, height: 18,
                          background: colorMap[dept] || 'var(--mid)',
                          opacity: 0.7,
                        }}
                        title={dept}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Mini calendar grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                {['S','M','T','W','T','F','S'].map((d, i) => (
                  <div key={i} style={{
                    fontSize: 6.5, fontWeight: 700, color: 'var(--mid)',
                    textAlign: 'center', padding: '2px 1px',
                    fontFamily: 'var(--ff-mono)',
                    borderBottom: '1px solid var(--rule)',
                    marginBottom: 2,
                  }}>
                    {d}
                  </div>
                ))}
                {days.map(day => {
                  const isToday = day.dateStr === todayStr;
                  const hasEvents = (eventsByDate[day.dateStr] || []).length > 0;
                  const eventsHere = eventsByDate[day.dateStr] || [];
                  const dotColor = eventsHere[0] ? getEventColor(eventsHere[0].department, eventsHere[0].id) : 'var(--accent)';

                  return (
                    <div
                      key={day.dateStr}
                      style={{
                        fontSize: 7,
                        padding: '2px 1px',
                        textAlign: 'center',
                        opacity: day.isCurrentMonth ? 1 : 0.25,
                        background: isToday ? 'var(--accent)' : 'transparent',
                        color: isToday ? 'var(--paper)' : 'var(--ink)',
                        fontWeight: isToday ? 700 : 400,
                        position: 'relative',
                      }}
                    >
                      {day.date.getDate()}
                      {hasEvents && !isToday && (
                        <div style={{
                          position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                          width: 3, height: 3,
                          background: dotColor,
                          borderRadius: '50%',
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
