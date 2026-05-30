'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, ChevronRight } from 'lucide-react';
import { CalendarEvent } from '@/types/calendar';
import { getUpcomingEvents, getTimeUntil, formatDateDisplay } from '@/lib/calendar-utils';
import { EventCard } from './EventCard';

interface UpcomingEventsPanelProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
}

export function UpcomingEventsPanel({ events, onEventClick }: UpcomingEventsPanelProps) {
  const upcomingEvents = getUpcomingEvents(events, 14);
  const displayEvents = upcomingEvents.slice(0, 5);

  if (displayEvents.length === 0) {
    return (
      <div style={{
        padding: '20px',
        border: '1px solid var(--rule)',
        background: 'var(--paper)',
        textAlign: 'center'
      }}>
        <Calendar size={20} style={{ color: 'var(--mid)', margin: '0 auto 8px' }} />
        <p style={{ fontSize: 9, color: 'var(--mid)', letterSpacing: '0.08em', margin: 0, textTransform: 'uppercase' }}>
          No upcoming events
        </p>
      </div>
    );
  }

  return (
    <div className="db-rise-0" style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <h2 style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--ink)',
            margin: 0,
            marginBottom: 2
          }}>
            Up Next
          </h2>
          <p style={{
            fontSize: 9,
            color: 'var(--mid)',
            margin: 0,
            letterSpacing: '0.04em'
          }}>
            {displayEvents.length} upcoming event{displayEvents.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/calendar" style={{ textDecoration: 'none' }}>
          <button className="db-btn" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9 }}>
            View Calendar
            <ChevronRight size={10} strokeWidth={2} />
          </button>
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid var(--rule)', borderBottom: 'none' }}>
        {displayEvents.map((event, i) => {
          const timeUntil = getTimeUntil(event.date, event.time);
          return (
            <div key={event.id} style={{
              borderBottom: i < displayEvents.length - 1 ? '1px solid var(--rule)' : 'none',
              padding: '12px 14px',
              background: 'var(--paper)',
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
              cursor: onEventClick ? 'pointer' : 'default',
              transition: 'background 0.12s'
            }}
            onMouseEnter={(e) => {
              if (onEventClick) (e.currentTarget as HTMLElement).style.background = 'var(--accent-sub)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--paper)';
            }}
            onClick={() => onEventClick?.(event)}
            >
              <div style={{
                padding: '8px 10px',
                background: 'var(--accent-sub)',
                borderRadius: '4px',
                textAlign: 'center',
                flexShrink: 0
              }}>
                <div style={{ fontSize: 7, fontWeight: 700, color: 'var(--mid)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>
                  {new Date(event.date).toLocaleString('en-US', { weekday: 'short' })}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
                  {new Date(event.date).getDate()}
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', marginBottom: 4, wordBreak: 'break-word' }}>
                  {event.title}
                </div>
                <div style={{ fontSize: 8, color: 'var(--mid)', letterSpacing: '0.04em' }}>
                  {event.time}
                </div>
                {event.meeting_link && (
                  <a
                    href={event.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'inline-block',
                      marginTop: 6,
                      fontSize: 8,
                      color: 'var(--accent)',
                      fontWeight: 700,
                      textDecoration: 'none',
                      letterSpacing: '0.05em'
                    }}
                  >
                    JOIN MEETING →
                  </a>
                )}
              </div>

              <div style={{
                fontSize: 8,
                color: 'var(--mid)',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textAlign: 'right',
                flexShrink: 0,
                whiteSpace: 'nowrap'
              }}>
                {timeUntil}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
