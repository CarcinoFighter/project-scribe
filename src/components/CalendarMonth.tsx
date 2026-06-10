'use client';

import React, { useState } from 'react';
import { getDaysInMonth, getEventColor, formatEventTime } from '@/lib/calendar-utils';
import { CalendarEvent } from '@/types/calendar';
import { X, Plus } from 'lucide-react';

interface CalendarMonthProps {
  year: number;
  month: number;
  events: CalendarEvent[];
  onDayClick?: (date: string) => void;
  onEventClick?: (event: CalendarEvent) => void;
  highlightToday?: boolean;
}

// Overflow modal for "+N more" days
function DayOverflowModal({
  dateStr,
  events,
  onEventClick,
  onClose,
}: {
  dateStr: string;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onClose: () => void;
}) {
  const dateObj = new Date(dateStr + 'T00:00:00');
  const label = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 9980,
          animation: 'fadeIn 0.15s ease',
        }}
      />
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9981,
        background: 'var(--paper)',
        border: '1px solid var(--rule)',
        width: 320, maxWidth: '90vw',
        maxHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 16px 60px rgba(0,0,0,0.6)',
        animation: 'slideUp 0.15s ease',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderBottom: '1px solid var(--rule)',
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.04em' }}>
            {label}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mid)', display: 'flex', padding: 2 }}>
            <X size={14} strokeWidth={2} />
          </button>
        </div>
        <div style={{ overflowY: 'auto', padding: '8px 0' }}>
          {events.map(event => {
            const color = getEventColor(event.department, event.id);
            return (
              <div
                key={event.id}
                onClick={() => { onEventClick?.(event); onClose(); }}
                style={{
                  padding: '8px 16px', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', gap: 10, transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent-sub)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <div style={{ width: 8, height: 8, flexShrink: 0, background: color }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {event.title}
                  </div>
                  <div style={{ fontSize: 8, color: 'var(--mid)', marginTop: 2 }}>
                    {formatEventTime(event.time)} · {event.duration_minutes}m
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function CalendarMonth({ year, month, events, onDayClick, onEventClick, highlightToday }: CalendarMonthProps) {
  const days = getDaysInMonth(year, month);
  const [overflowDay, setOverflowDay] = useState<string | null>(null);

  const eventsByDate = events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
    if (!acc[event.date]) acc[event.date] = [];
    acc[event.date].push(event);
    return acc;
  }, {});

  // Compute max events in any day for heat map intensity
  const maxEvents = Math.max(1, ...Object.values(eventsByDate).map(e => e.length));

  const weekDayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const overflowEvents = overflowDay ? (eventsByDate[overflowDay] || []) : [];

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Week day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {weekDayHeaders.map((day, i) => (
            <div
              key={day}
              style={{
                padding: '10px 0',
                textAlign: 'center',
                fontSize: 8,
                fontFamily: 'var(--ff-mono)',
                fontWeight: 700,
                color: (i === 0 || i === 6) ? 'var(--accent)' : 'var(--mid)',
                letterSpacing: '0.1em',
                borderBottom: '2px solid var(--rule)',
                textTransform: 'uppercase',
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {days.map((day, idx) => {
            const dayEvents = eventsByDate[day.dateStr] || [];
            const visibleEvents = dayEvents.slice(0, 3);
            const overflowCount = dayEvents.length - visibleEvents.length;
            const isWeekend = day.dayOfWeek === 0 || day.dayOfWeek === 6;

            // Heat map: subtle tint based on event density
            const heatIntensity = day.isCurrentMonth && dayEvents.length > 0
              ? Math.min(0.12, (dayEvents.length / maxEvents) * 0.15)
              : 0;

            const bg = day.isToday
              ? 'var(--accent-sub)'
              : !day.isCurrentMonth
              ? 'var(--cream)'
              : heatIntensity > 0
              ? `rgba(152,117,193,${heatIntensity})`
              : isWeekend
              ? 'rgba(255,255,255,0.02)'
              : 'var(--paper)';

            return (
              <div
                key={day.dateStr}
                onClick={() => onDayClick?.(day.dateStr)}
                style={{
                  minHeight: 108,
                  padding: '8px 7px 6px',
                  border: '1px solid var(--rule)',
                  borderLeft: idx % 7 === 0 ? '2px solid var(--rule)' : '1px solid var(--rule)',
                  borderTop: 'none',
                  background: bg,
                  opacity: day.isCurrentMonth ? 1 : 0.45,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  position: 'relative',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--accent-sub)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = bg;
                }}
              >
                {/* Day number */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 2,
                }}>
                  <div style={{
                    fontSize: 12,
                    fontWeight: day.isToday ? 800 : 500,
                    color: day.isToday ? 'var(--paper)' : isWeekend && day.isCurrentMonth ? 'var(--accent)' : 'var(--ink)',
                    background: day.isToday ? 'var(--accent)' : 'transparent',
                    width: day.isToday ? 22 : 'auto',
                    height: day.isToday ? 22 : 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                    fontFamily: 'var(--ff-mono)',
                  }}>
                    {day.date.getDate()}
                  </div>
                  {dayEvents.length > 0 && day.isCurrentMonth && (
                    <div style={{
                      fontSize: 6, fontFamily: 'var(--ff-mono)', color: 'var(--mid)',
                      opacity: 0.7,
                    }}>
                      {dayEvents.length}
                    </div>
                  )}
                </div>

                {/* Event pills */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                  {visibleEvents.map(event => {
                    const color = getEventColor(event.department, event.id);
                    const isTask = event.id.startsWith('task-');
                    return (
                      <div
                        key={event.id}
                        onClick={e => { e.stopPropagation(); onEventClick?.(event); }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '2px 5px',
                          background: `${color}22`,
                          borderLeft: `2px solid ${color}`,
                          cursor: 'pointer',
                          transition: 'all 0.1s',
                          minWidth: 0,
                        }}
                        onMouseEnter={e => {
                          e.stopPropagation();
                          (e.currentTarget as HTMLElement).style.background = `${color}40`;
                        }}
                        onMouseLeave={e => {
                          e.stopPropagation();
                          (e.currentTarget as HTMLElement).style.background = `${color}22`;
                        }}
                        title={`${event.title} · ${formatEventTime(event.time)}`}
                      >
                        {isTask && (
                          <div style={{ width: 4, height: 4, flexShrink: 0, background: color, opacity: 0.8 }} />
                        )}
                        <span style={{
                          fontSize: 7,
                          fontWeight: 700,
                          color: 'var(--ink)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                          minWidth: 0,
                        }}>
                          {event.title}
                        </span>
                      </div>
                    );
                  })}
                  {overflowCount > 0 && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setOverflowDay(day.dateStr);
                      }}
                      style={{
                        padding: '2px 5px',
                        background: 'none',
                        border: '1px solid var(--rule)',
                        cursor: 'pointer',
                        fontSize: 7,
                        fontWeight: 700,
                        color: 'var(--accent)',
                        textAlign: 'left',
                        transition: 'all 0.1s',
                        letterSpacing: '0.03em',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent-sub)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                    >
                      +{overflowCount} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Overflow modal */}
      {overflowDay && (
        <DayOverflowModal
          dateStr={overflowDay}
          events={overflowEvents}
          onEventClick={onEventClick}
          onClose={() => setOverflowDay(null)}
        />
      )}
    </>
  );
}
