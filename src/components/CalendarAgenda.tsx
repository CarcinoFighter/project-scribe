'use client';

import React, { useMemo } from 'react';
import { Clock, MapPin, Link as LinkIcon, Users, ExternalLink, Tag } from 'lucide-react';
import { CalendarEvent } from '@/types/calendar';
import { formatEventTime, getEventColor, formatDateToISO } from '@/lib/calendar-utils';
import { Plus } from 'lucide-react';

interface CalendarAgendaProps {
  date: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDayClick?: (date: string) => void;
}

function getDaysRange(startDate: Date, count: number): Date[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return d;
  });
}

export function CalendarAgenda({ date, events, onEventClick, onDayClick }: CalendarAgendaProps) {
  // Show 60 days from start of current month
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const days = getDaysRange(start, 60);
  const todayStr = formatDateToISO(new Date());

  const eventsByDate = useMemo(() => {
    return events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
      if (!acc[event.date]) acc[event.date] = [];
      acc[event.date].push(event);
      return acc;
    }, {});
  }, [events]);

  // Only show days that have events or are today
  const activeDays = days.filter(d => {
    const str = formatDateToISO(d);
    return eventsByDate[str]?.length > 0 || str === todayStr;
  });

  if (activeDays.length === 0) {
    return (
      <div style={{
        padding: '60px 20px',
        textAlign: 'center',
        border: '1px solid var(--rule)',
        background: 'var(--paper)',
      }}>
        <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>◷</div>
        <p style={{ fontSize: 11, color: 'var(--mid)', margin: 0 }}>No events in this period.</p>
        <p style={{ fontSize: 9, color: 'var(--mid)', marginTop: 6, letterSpacing: '0.04em' }}>
          Events you create will appear here.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid var(--rule)' }}>
      {activeDays.map((day, dayIdx) => {
        const dateStr = formatDateToISO(day);
        const dayEvents = (eventsByDate[dateStr] || []).sort((a, b) => a.time.localeCompare(b.time));
        const isToday = dateStr === todayStr;
        const isPast = day < new Date() && !isToday;

        return (
          <div
            key={dateStr}
            style={{
              display: 'flex',
              borderBottom: dayIdx < activeDays.length - 1 ? '1px solid var(--rule)' : 'none',
              background: isToday ? 'rgba(152,117,193,0.04)' : 'var(--paper)',
            }}
          >
            {/* Day label column */}
            <div
              style={{
                width: 88,
                flexShrink: 0,
                padding: '14px 16px',
                borderRight: `2px solid ${isToday ? 'var(--accent)' : 'var(--rule)'}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 2,
                cursor: 'pointer',
                opacity: isPast ? 0.55 : 1,
              }}
              onClick={() => onDayClick?.(dateStr)}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent-sub)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <span style={{
                fontSize: 7, fontWeight: 700, color: isToday ? 'var(--accent)' : 'var(--mid)',
                letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--ff-mono)',
              }}>
                {day.toLocaleString('en-US', { weekday: 'short' })}
              </span>
              <span style={{
                fontSize: 22, fontWeight: 700, lineHeight: 1,
                color: isToday ? 'var(--accent)' : 'var(--ink)',
                fontFamily: 'var(--ff-display)',
              }}>
                {day.getDate()}
              </span>
              <span style={{ fontSize: 7, color: 'var(--mid)', letterSpacing: '0.06em', fontFamily: 'var(--ff-mono)' }}>
                {day.toLocaleString('en-US', { month: 'short' })}
              </span>
              {isToday && (
                <span style={{
                  marginTop: 4, fontSize: 6, fontWeight: 700, color: 'var(--paper)',
                  background: 'var(--accent)', padding: '1px 5px',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>
                  Today
                </span>
              )}
              <button
                onClick={e => { e.stopPropagation(); onDayClick?.(dateStr); }}
                style={{
                  marginTop: 6, background: 'none', border: '1px solid var(--rule)',
                  cursor: 'pointer', padding: '2px 5px', display: 'flex', alignItems: 'center',
                  gap: 3, fontSize: 7, color: 'var(--mid)', opacity: 0,
                  transition: 'opacity 0.1s',
                }}
                className="agenda-add-btn"
              >
                <Plus size={7} strokeWidth={2.5} /> Add
              </button>
            </div>

            {/* Events column */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
              {dayEvents.length === 0 ? (
                <div style={{ padding: '14px 16px', fontSize: 9, color: 'var(--mid)', fontStyle: 'italic' }}>
                  No events — click date to add one
                </div>
              ) : (
                dayEvents.map((event, i) => {
                  const color = getEventColor(event.department, event.id);
                  const isTask = event.id.startsWith('task-');
                  const endMinutes = (parseInt(event.time.split(':')[0]) * 60 + parseInt(event.time.split(':')[1] || '0')) + (event.duration_minutes || 60);
                  const endH = Math.floor(endMinutes / 60) % 24;
                  const endM = endMinutes % 60;
                  const endTimeStr = `${endH < 12 ? endH : endH - 12 || 12}:${String(endM).padStart(2, '0')} ${endH < 12 ? 'AM' : 'PM'}`;

                  return (
                    <div
                      key={event.id}
                      onClick={() => onEventClick?.(event)}
                      style={{
                        display: 'flex',
                        alignItems: 'stretch',
                        gap: 0,
                        padding: '10px 16px 10px 0',
                        borderBottom: i < dayEvents.length - 1 ? '1px solid var(--rule)' : 'none',
                        cursor: 'pointer',
                        transition: 'background 0.1s',
                        background: 'transparent',
                        opacity: isPast ? 0.7 : 1,
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent-sub)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      {/* Color bar */}
                      <div style={{
                        width: 3, flexShrink: 0, background: color, marginRight: 14,
                        marginLeft: 0, alignSelf: 'stretch',
                      }} />

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                            {isTask && (
                              <span style={{
                                fontSize: 6, fontWeight: 700, padding: '1px 5px',
                                background: `${color}22`, color: color,
                                letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0,
                                border: `1px solid ${color}40`,
                              }}>
                                TASK
                              </span>
                            )}
                            {event.department && !isTask && (
                              <span style={{
                                fontSize: 6, fontWeight: 700, padding: '1px 5px',
                                background: `${color}22`, color: color,
                                letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0,
                                border: `1px solid ${color}40`,
                              }}>
                                {event.department}
                              </span>
                            )}
                            <span style={{
                              fontSize: 12, fontWeight: 700, color: 'var(--ink)',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {event.title}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', alignItems: 'center' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'var(--mid)' }}>
                            <Clock size={9} strokeWidth={1.8} />
                            {formatEventTime(event.time)}
                            {event.duration_minutes && (
                              <span style={{ color: 'var(--mid)' }}>→ {endTimeStr} · {event.duration_minutes}m</span>
                            )}
                          </span>

                          {event.location && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'var(--mid)' }}>
                              <MapPin size={9} strokeWidth={1.8} />
                              {event.location}
                            </span>
                          )}

                          {event.assigned_to && event.assigned_to.length > 0 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'var(--mid)' }}>
                              <Users size={9} strokeWidth={1.8} />
                              {event.assigned_to.length} attendee{event.assigned_to.length > 1 ? 's' : ''}
                            </span>
                          )}

                          {event.meeting_link && (
                            <a
                              href={event.meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                fontSize: 9, color: 'var(--accent)', textDecoration: 'none', fontWeight: 700,
                              }}
                            >
                              <ExternalLink size={9} strokeWidth={2} />
                              Join
                            </a>
                          )}
                        </div>

                        {event.description && (
                          <p style={{
                            margin: '6px 0 0',
                            fontSize: 9, color: 'var(--mid)', lineHeight: 1.5,
                            overflow: 'hidden', display: '-webkit-box',
                            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                          }}>
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
