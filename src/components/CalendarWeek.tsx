'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { getWeekDays } from '@/lib/calendar-utils';
import { CalendarEvent } from '@/types/calendar';
import { getEventColor, formatEventTime, formatDateToISO } from '@/lib/calendar-utils';
import { Plus } from 'lucide-react';

interface CalendarWeekProps {
  date: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDayClick?: (date: string) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const CELL_HEIGHT = 60; // px per hour

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

// Compute layout columns for overlapping events
function layoutEvents(events: CalendarEvent[]): Array<CalendarEvent & { col: number; totalCols: number }> {
  if (!events.length) return [];

  const sorted = [...events].sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));
  const result: Array<CalendarEvent & { col: number; totalCols: number }> = [];

  // Simple greedy column assignment
  const cols: number[] = []; // each col stores the end minute of the last event in that col

  const withCols = sorted.map(event => {
    const start = parseTimeToMinutes(event.time);
    const end = start + (event.duration_minutes || 60);
    // Find a free column
    let col = 0;
    while (col < cols.length && cols[col] > start) col++;
    cols[col] = end;
    return { ...event, col, _end: end };
  });

  // Determine totalCols per event (max column overlap group)
  return withCols.map(event => {
    const start = parseTimeToMinutes(event.time);
    const end = event._end;
    // Find all events overlapping this one
    const overlapping = withCols.filter(e => {
      const es = parseTimeToMinutes(e.time);
      const ee = e._end;
      return es < end && ee > start;
    });
    const maxCol = Math.max(...overlapping.map(e => e.col));
    return { ...event, totalCols: maxCol + 1 };
  });
}

export function CalendarWeek({ date, events, onEventClick, onDayClick }: CalendarWeekProps) {
  const weekDays = getWeekDays(date);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 7 * CELL_HEIGHT;
    }
  }, []);

  const eventsByDate = useMemo(() => {
    return events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
      if (!acc[event.date]) acc[event.date] = [];
      acc[event.date].push(event);
      return acc;
    }, {});
  }, [events]);

  const layoutByDate = useMemo(() => {
    const result: Record<string, ReturnType<typeof layoutEvents>> = {};
    weekDays.forEach(day => {
      result[day.dateStr] = layoutEvents(eventsByDate[day.dateStr] || []);
    });
    return result;
  }, [eventsByDate, weekDays]);

  const now = new Date();
  const todayStr = formatDateToISO(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const isThisWeek = weekDays.some(d => d.dateStr === todayStr);

  const handleColumnClick = (e: React.MouseEvent, dateStr: string) => {
    // Only trigger if clicking directly on the column (not an event)
    if ((e.target as HTMLElement).dataset.eventarea) return;
    onDayClick?.(dateStr);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--rule)', overflow: 'hidden' }}>
      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)', borderBottom: '2px solid var(--rule)', background: 'var(--paper)', position: 'sticky', top: 0, zIndex: 2 }}>
        <div style={{ borderRight: '1px solid var(--rule)' }} />
        {weekDays.map(day => (
          <div
            key={day.dateStr}
            onClick={() => onDayClick?.(day.dateStr)}
            style={{
              padding: '10px 8px',
              borderRight: '1px solid var(--rule)',
              background: day.isToday ? 'var(--accent-sub)' : 'var(--paper)',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent-sub)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = day.isToday ? 'var(--accent-sub)' : 'var(--paper)'}
          >
            <div style={{
              fontSize: 8, fontWeight: 700,
              color: day.isToday ? 'var(--accent)' : (day.dayOfWeek === 0 || day.dayOfWeek === 6) ? 'var(--accent)' : 'var(--mid)',
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4,
              fontFamily: 'var(--ff-mono)',
            }}>
              {day.dayName}
            </div>
            <div style={{
              fontSize: day.isToday ? 18 : 16, fontWeight: 700,
              color: day.isToday ? 'var(--paper)' : 'var(--ink)',
              background: day.isToday ? 'var(--accent)' : 'transparent',
              width: day.isToday ? 28 : 'auto',
              height: day.isToday ? 28 : 'auto',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: day.isToday ? '0 auto' : undefined,
              lineHeight: 1,
            }}>
              {day.date.getDate()}
            </div>
            {/* Event count badge */}
            {(eventsByDate[day.dateStr] || []).length > 0 && (
              <div style={{
                marginTop: 4, fontSize: 7, fontWeight: 700,
                color: day.isToday ? 'var(--accent)' : 'var(--mid)',
                fontFamily: 'var(--ff-mono)',
              }}>
                {(eventsByDate[day.dateStr] || []).length}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Scrollable time grid */}
      <div ref={scrollRef} style={{ overflowY: 'auto', maxHeight: 640, position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)', position: 'relative' }}>
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
                  paddingRight: 10,
                  paddingTop: 4,
                  borderBottom: '1px solid var(--rule)',
                  opacity: hour === 0 ? 0 : 1,
                }}
              >
                <span style={{
                  fontSize: 8,
                  fontFamily: 'var(--ff-mono)',
                  color: 'var(--mid)',
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                }}>
                  {hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map(day => {
            const dayLayoutEvents = layoutByDate[day.dateStr] || [];

            return (
              <div
                key={day.dateStr}
                onClick={e => handleColumnClick(e, day.dateStr)}
                style={{
                  borderRight: '1px solid var(--rule)',
                  position: 'relative',
                  background: day.isToday ? `rgba(152,117,193,0.04)` : 'transparent',
                  cursor: 'pointer',
                }}
              >
                {/* Hour cells */}
                {HOURS.map(hour => (
                  <div
                    key={hour}
                    style={{
                      height: CELL_HEIGHT,
                      borderBottom: '1px solid var(--rule)',
                      background: hour % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(152,117,193,0.06)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = hour % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'}
                  />
                ))}

                {/* Half-hour lines */}
                {HOURS.map(hour => (
                  <div
                    key={`h-${hour}`}
                    style={{
                      position: 'absolute',
                      top: hour * CELL_HEIGHT + CELL_HEIGHT / 2,
                      left: 0, right: 0,
                      height: 1,
                      background: 'var(--rule)',
                      opacity: 0.4,
                      pointerEvents: 'none',
                    }}
                  />
                ))}

                {/* Current time line */}
                {day.isToday && isThisWeek && (
                  <div style={{
                    position: 'absolute',
                    top: (nowMinutes / 60) * CELL_HEIGHT,
                    left: 0, right: 0,
                    height: 2,
                    background: 'var(--accent)',
                    zIndex: 3,
                    pointerEvents: 'none',
                  }}>
                    <div style={{
                      position: 'absolute', left: -5, top: -4,
                      width: 10, height: 10,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      boxShadow: '0 0 6px var(--accent)',
                    }} />
                  </div>
                )}

                {/* Events */}
                {dayLayoutEvents.map(event => {
                  const startMin = parseTimeToMinutes(event.time);
                  const durationMin = event.duration_minutes || 60;
                  const top = (startMin / 60) * CELL_HEIGHT;
                  const height = Math.max((durationMin / 60) * CELL_HEIGHT - 3, 20);
                  const color = getEventColor(event.department, event.id);
                  const isTask = event.id.startsWith('task-');

                  const colWidth = 100 / event.totalCols;
                  const left = event.col * colWidth;

                  return (
                    <div
                      key={event.id}
                      onClick={e => { e.stopPropagation(); onEventClick?.(event); }}
                      data-eventarea="1"
                      title={`${event.title} · ${formatEventTime(event.time)}`}
                      style={{
                        position: 'absolute',
                        top: top + 2,
                        left: `calc(${left}% + 2px)`,
                        width: `calc(${colWidth}% - 4px)`,
                        height,
                        background: isTask ? `${color}18` : `${color}22`,
                        borderLeft: `3px solid ${color}`,
                        borderTop: isTask ? `1px dashed ${color}50` : 'none',
                        padding: '3px 5px',
                        cursor: 'pointer',
                        zIndex: 2,
                        overflow: 'hidden',
                        transition: 'all 0.1s',
                        boxSizing: 'border-box',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = `${color}40`;
                        (e.currentTarget as HTMLElement).style.zIndex = '4';
                        (e.currentTarget as HTMLElement).style.boxShadow = `0 2px 12px ${color}40`;
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = isTask ? `${color}18` : `${color}22`;
                        (e.currentTarget as HTMLElement).style.zIndex = '2';
                        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                      }}
                    >
                      <div style={{
                        fontSize: 8, fontWeight: 700, color: 'var(--ink)',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: height >= 36 ? 'normal' : 'nowrap',
                        lineHeight: 1.3,
                        display: '-webkit-box',
                        WebkitLineClamp: height >= 48 ? 3 : 1,
                        WebkitBoxOrient: 'vertical',
                        pointerEvents: 'none',
                      }}>
                        {event.title}
                      </div>
                      {height >= 32 && (
                        <div style={{
                          fontSize: 7, color: 'var(--mid)',
                          fontFamily: 'var(--ff-mono)', marginTop: 2,
                          pointerEvents: 'none',
                        }}>
                          {formatEventTime(event.time)}
                        </div>
                      )}
                      {isTask && height >= 28 && (
                        <div style={{
                          position: 'absolute', top: 3, right: 4,
                          fontSize: 6, fontWeight: 700, color: color,
                          letterSpacing: '0.08em', textTransform: 'uppercase',
                          pointerEvents: 'none',
                        }}>
                          Task
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
