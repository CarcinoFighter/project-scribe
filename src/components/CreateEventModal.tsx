'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus } from 'lucide-react';
import { CalendarEvent } from '@/types/calendar';
import MultiPersonSelect from './MultiPersonSelect';
import MiniCalendar from './MiniCalendar';
import { DEPARTMENTS } from '@/config/departments';

interface CreateEventModalProps {
  onClose: () => void;
  onSuccess: (event: CalendarEvent) => void;
  initialDate?: string;
}

export function CreateEventModal({ onClose, onSuccess, initialDate }: CreateEventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState('60');
  const [meetingLink, setMeetingLink] = useState('');
  const [location, setLocation] = useState('');
  const [department, setDepartment] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger slide-in on mount
    requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 220);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Event title is required'); return; }
    if (!date) { setError('Date is required'); return; }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          date,
          time,
          duration_minutes: parseInt(duration, 10),
          meeting_link: meetingLink.trim() || undefined,
          location: location.trim() || undefined,
          department: department || undefined,
          assigned_to: selectedUsers,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create event');
      }

      const newEvent = await response.json();
      onSuccess(newEvent);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const label: React.CSSProperties = {
    display: 'block',
    fontSize: 8,
    fontWeight: 700,
    color: 'var(--mid)',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    marginBottom: 6,
  };

  const input: React.CSSProperties = {
    width: '100%',
    padding: '9px 11px',
    fontFamily: 'var(--ff-ui)',
    fontSize: 11,
    border: '1px solid var(--rule)',
    background: 'var(--cream)',
    color: 'var(--ink)',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(10,10,10,0.55)',
          zIndex: 9988,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.22s ease',
        }}
      />

      {/* Drawer panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 400,
          maxWidth: '100vw',
          zIndex: 9989,
          background: 'var(--paper)',
          borderLeft: '1px solid var(--rule)',
          display: 'flex',
          flexDirection: 'column',
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.22s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          height: 52,
          borderBottom: '2px solid var(--rule)',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            New Event
          </span>
          <button
            type="button"
            onClick={handleClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: 'var(--mid)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--ink)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--mid)'}
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Scrollable form body */}
        <form
          onSubmit={handleSubmit}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {error && (
            <div style={{
              padding: '10px 12px',
              background: 'rgba(220,50,50,0.1)',
              border: '1px solid rgba(220,50,50,0.4)',
              fontSize: 10,
              color: '#e05050',
              letterSpacing: '0.04em',
            }}>
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label style={label}>Event Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Team standup"
              autoFocus
              style={input}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--rule)')}
            />
          </div>

          {/* Description */}
          <div>
            <label style={label}>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional notes…"
              style={{ ...input, minHeight: 70, resize: 'vertical' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--rule)')}
            />
          </div>

          {/* Department */}
          <div>
            <label style={label}>Department</label>
            <select
              value={department}
              onChange={e => setDepartment(e.target.value)}
              style={{ ...input, cursor: 'pointer' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--rule)')}
            >
              <option value="">All Departments</option>
              {DEPARTMENTS.map(d => (
                <option key={d.key} value={d.key}>{d.label}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label style={label}>Date *</label>
            <MiniCalendar value={date} onChange={setDate} />
          </div>

          {/* Time + Duration */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={label}>Time</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                style={input}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--rule)')}
              />
            </div>
            <div>
              <label style={label}>Duration (min)</label>
              <input
                type="number"
                min="15"
                step="15"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                style={input}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--rule)')}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label style={label}>Location</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Conference Room A, Virtual…"
              style={input}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--rule)')}
            />
          </div>

          {/* Meeting link */}
          <div>
            <label style={label}>Google Meet Link</label>
            <input
              type="url"
              value={meetingLink}
              onChange={e => setMeetingLink(e.target.value)}
              placeholder="https://meet.google.com/…"
              style={{ ...input, fontFamily: 'var(--ff-mono)', fontSize: 10 }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--rule)')}
            />
          </div>

          {/* Attendees */}
          <div>
            <label style={label}>Invite Attendees</label>
            <MultiPersonSelect
              selectedIds={selectedUsers}
              onChange={setSelectedUsers}
              placeholder="Search team members…"
            />
          </div>
        </form>

        {/* Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--rule)',
          flexShrink: 0,
          display: 'flex',
          gap: 8,
        }}>
          <button
            type="submit"
            form=""
            onClick={handleSubmit}
            disabled={loading}
            className="db-btn"
            style={{ flex: 1, justifyContent: 'center', opacity: loading ? 0.6 : 1 }}
          >
            <Plus size={10} strokeWidth={2.5} />
            {loading ? 'Creating…' : 'Create Event'}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="db-ghost"
            style={{ padding: '9px 16px', fontSize: 9, fontWeight: 700 }}
          >
            Cancel
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}