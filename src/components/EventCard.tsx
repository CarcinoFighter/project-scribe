'use client';

import React from 'react';
import { Clock, MapPin, Link as LinkIcon, Users } from 'lucide-react';
import { CalendarEvent } from '@/types/calendar';
import { formatEventTime, getEventColor } from '@/lib/calendar-utils';

interface EventCardProps {
  event: CalendarEvent;
  onClick?: () => void;
  attendees?: Array<{ id: string; name: string; avatar_url?: string }>;
}

export function EventCard({ event, onClick, attendees = [] }: EventCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px 14px',
        border: '1px solid var(--rule)',
        background: 'var(--paper)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.15s',
        borderLeft: `3px solid ${getEventColor(event.department, event.id)}`,
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          (e.currentTarget as HTMLElement).style.background = 'var(--accent-sub)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'var(--paper)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      <div style={{ marginBottom: 8 }}>
        <h4 style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--ink)',
          margin: 0,
          wordBreak: 'break-word'
        }}>
          {event.title}
        </h4>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9, color: 'var(--mid)' }}>
          <Clock size={10} strokeWidth={1.8} />
          <span>{formatEventTime(event.time)}</span>
          {event.duration_minutes && (
            <span>· {event.duration_minutes}m</span>
          )}
        </div>

        {event.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9, color: 'var(--mid)' }}>
            <MapPin size={10} strokeWidth={1.8} />
            <span>{event.location}</span>
          </div>
        )}

        {event.meeting_link && (
          <a
            href={event.meeting_link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 9,
              color: 'var(--accent)',
              textDecoration: 'none',
              cursor: 'pointer'
            }}
            title="Join meeting"
          >
            <LinkIcon size={10} strokeWidth={1.8} />
            <span>Join Meeting</span>
          </a>
        )}

        {attendees.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 8, color: 'var(--mid)' }}>
            <Users size={9} strokeWidth={1.8} />
            <span>{attendees.length} attendee{attendees.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </div>
  );
}
