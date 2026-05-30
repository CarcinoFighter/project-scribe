'use client';

import React, { useRef, useEffect } from 'react';
import { getWeekDays } from '@/lib/calendar-utils';
import { CalendarEvent } from '@/types/calendar';
import { getEventColor, formatEventTime } from '@/lib/calendar-utils';

interface CalendarWeekProps {
  date: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const CELL_HEIGHT = 56; // px per hour

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function CalendarWeek({ date, events, onEventClick }: CalendarWeekProps) {
  const weekDays = getWeekDays(date);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to 7am on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 7 * CELL_HEIGHT;
    }
  }, []);

  const eventsByDate = events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
    if (!acc[event.date]) acc[event.date] = [];
    acc[event.date].push(event);
    return acc;
  }, {});

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const isThisWeek = weekDays.some(d => d.dateStr === todayStr);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--rule)', overflow: 'hidden' }}>
      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '48px repeat(7, 1fr)', borderBottom: '2px solid var(--rule)', background: 'var(--paper)', position: 'sticky', top: 0, zIndex: 2 }}>
        <div style={{ borderRight: '1px solid var(--rule)' }} />
        {weekDays.map(day => (
          <div
            key={day.dateStr}
            style={{
              padding: '10px 8px',
              borderRight: '1px solid var(--rule)',
              background: day.isToday ? 'var(--accent-sub)' : 'var(--paper)',
              textAlign: 'center',
            }}
          >
            <div style={{
              fontSize: 9,
              fontWeight: 700,
              color: day.isToday ? 'var(--accent)' : 'var(--mid)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 4,
            }}>
              {day.dayName}
            </div>
            <div style={{
              fontSize: 16,
              fontWeight: 700,
              color: day.isToday ? 'var(--accent)' : 'var(--ink)',
              lineHeight: 1,
            }}>
              {day.date.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* Scrollable time grid */}
      <div ref={scrollRef} style={{ overflowY: 'auto', maxHeight: 620, position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '48px repeat(7, 1fr)', position: 'relative' }}>
          {/* Time gutter */}
          <div style={{ borderRight: '1px solid var(--rule)', position: 'relative', zIndex: 1 }}>
            {HOURS.map(hour => (
              <div
                key={hour}
                style={{
                  height: CELL_HEIGHT,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-end',
                  paddingRight: 8,
                  paddingTop: 4,
                  borderBottom: '1px solid var(--rule)',
                }}
              >
                {hour > 0 && (
                  <span style={{
                    fontSize: 8,
                    fontFamily: 'var(--ff-mono)',
                    color: 'var(--mid)',
                    letterSpacing: '0.04em',
                    whiteSpace: 'nowrap',
                  }}>
                    {hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map(day => {
            const dayEvents = eventsByDate[day.dateStr] || [];
            return (
              <div
                key={day.dateStr}
                style={{
                  borderRight: '1px solid var(--rule)',
                  position: 'relative',
                  background: day.isToday ? `rgba(152,117,193,0.03)` : 'transparent',
                }}
              >
                {/* Hour cells */}
                {HOURS.map(hour => (
                  <div
                    key={hour}
                    style={{
                      height: CELL_HEIGHT,
                      borderBottom: hour % 6 === 5
                        ? '1px solid rgba(255,255,255,0.12)'
                        : '1px solid var(--rule)',
                      opacity: hour % 2 === 0 ? 1 : 0.5,
                    }}
                  />
                ))}

                {/* Current time line */}
                {day.isToday && isThisWeek && (
                  <div style={{
                    position: 'absolute',
                    top: (nowMinutes / 60) * CELL_HEIGHT,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: 'var(--accent)',
                    zIndex: 3,
                    pointerEvents: 'none',
                  }}>
                    <div style={{
                      position: 'absolute',
                      left: -4,
                      top: -3,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                    }} />
                  </div>
                )}

                {/* Events */}
                {dayEvents.map(event => {
                  const startMin = parseTimeToMinutes(event.time);
                  const durationMin = event.duration_minutes || 60;
                  const top = (startMin / 60) * CELL_HEIGHT;
                  const height = Math.max((durationMin / 60) * CELL_HEIGHT - 2, 20);
                  const color = getEventColor(event.department);

                  return (
                    <div
                      key={event.id}
                      onClick={() => onEventClick?.(event)}
                      title={`${event.title} · ${formatEventTime(event.time)}`}
                      style={{
                        position: 'absolute',
                        top: top + 1,
                        left: 2,
                        right: 2,
                        height,
                        background: `${color}22`,
                        borderLeft: `3px solid ${color}`,
                        padding: '3px 5px',
                        cursor: 'pointer',
                        zIndex: 2,
                        overflow: 'hidden',
                        transition: 'all 0.12s',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = `${color}40`;
                        (e.currentTarget as HTMLElement).style.boxShadow = `0 2px 8px ${color}30`;
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = `${color}22`;
                        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                      }}
                    >
                      <div style={{
                        fontSize: 8,
                        fontWeight: 700,
                        color: 'var(--ink)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.3,
                      }}>
                        {event.title}
                      </div>
                      {height >= 36 && (
                        <div style={{
                          fontSize: 7,
                          color: 'var(--mid)',
                          fontFamily: 'var(--ff-mono)',
                          marginTop: 1,
                        }}>
                          {formatEventTime(event.time)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}