'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { X, Clock, MapPin, Link as LinkIcon, Users, Edit2, Trash2, Calendar, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { CalendarEvent } from '@/types/calendar';
import { formatEventTime, getEventColor } from '@/lib/calendar-utils';
import MultiPersonSelect from './MultiPersonSelect';
import MiniCalendar from './MiniCalendar';
import { DEPARTMENTS } from '@/config/departments';

interface EventDetailModalProps {
  event: CalendarEvent;
  onClose: () => void;
  onUpdated: (event: CalendarEvent) => void;
  onDeleted: (eventId: string) => void;
}

export function EventDetailModal({ event, onClose, onUpdated, onDeleted }: EventDetailModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  // Edit state
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description || '');
  const [date, setDate] = useState(event.date);
  const [time, setTime] = useState(event.time);
  const [duration, setDuration] = useState(String(event.duration_minutes || 60));
  const [meetingLink, setMeetingLink] = useState(event.meeting_link || '');
  const [location, setLocation] = useState(event.location || '');
  const [department, setDepartment] = useState(event.department || '');
  const [selectedUsers, setSelectedUsers] = useState<string[]>(event.assigned_to || []);

  const accentColor = getEventColor(event.department, event.id);
  const isTask = event.id.startsWith('task-');
  const canOpenInEditor = isTask && event.document_id && event.document_type;

  useEffect(() => {
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

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/calendar/events?id=${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          date, time,
          duration_minutes: parseInt(duration, 10) || 60,
          meeting_link: meetingLink.trim() || null,
          location: location.trim() || null,
          department: department || null,
          assigned_to: selectedUsers,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update');
      }
      const updated = await res.json();
      onUpdated(updated);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/calendar/events?id=${event.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }
      onDeleted(event.id);
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

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: mode === 'edit' ? 420 : 380,
          maxWidth: '100vw',
          zIndex: 9989,
          background: 'var(--paper)',
          borderLeft: '1px solid var(--rule)',
          borderTop: `3px solid ${accentColor}`,
          display: 'flex',
          flexDirection: 'column',
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.22s cubic-bezier(0.22,1,0.36,1), width 0.18s ease',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          height: 52,
          borderBottom: '1px solid var(--rule)',
          flexShrink: 0,
          gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            {mode === 'view' ? (
              <>
                {canOpenInEditor && (
                  <button
                    onClick={() => {
                      handleClose();
                      router.push(
                        `/editor?id=${event.document_id}&type=${event.document_type}`
                      );
                    }}
                    style={{
                      background: 'none',
                      border: `1px solid var(--accent)`,
                      cursor: 'pointer',
                      padding: '4px 9px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 9,
                      fontWeight: 700,
                      color: 'var(--accent)',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      flexShrink: 0,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-sub)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <ArrowRight size={9} strokeWidth={2.2} /> Open
                  </button>
                )}

                <button
                  onClick={() => setMode('edit')}
                  style={{
                    background: 'none',
                    border: '1px solid var(--rule)',
                    cursor: 'pointer',
                    padding: '4px 9px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 9,
                    fontWeight: 700,
                    color: 'var(--ink)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-sub)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <Edit2 size={9} strokeWidth={2.2} /> Edit
                </button>

                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    style={{
                      background: 'none',
                      border: '1px solid rgba(220,50,50,0.3)',
                      cursor: 'pointer',
                      padding: '4px 9px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 9,
                      fontWeight: 700,
                      color: '#e05050',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      flexShrink: 0,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(220,50,50,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <Trash2 size={9} strokeWidth={2.2} /> Delete
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 8, color: '#e05050', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Sure?</span>
                    <button
                      onClick={handleDelete}
                      disabled={loading}
                      style={{ background: '#e05050', border: 'none', cursor: 'pointer', padding: '4px 10px', fontSize: 9, fontWeight: 700, color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase', opacity: loading ? 0.6 : 1 }}
                    >
                      {loading ? '…' : 'Yes'}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      style={{ background: 'none', border: '1px solid var(--rule)', cursor: 'pointer', padding: '4px 10px', fontSize: 9, fontWeight: 700, color: 'var(--mid)', letterSpacing: '0.06em', textTransform: 'uppercase' }}
                    >
                      No
                    </button>
                  </div>
                )}
              </>
            ) : (
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Edit Event
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: 'var(--mid)', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--ink)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--mid)'}
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Error bar */}
        {error && (
          <div style={{
            padding: '10px 20px',
            background: 'rgba(220,50,50,0.1)',
            borderBottom: '1px solid rgba(220,50,50,0.3)',
            fontSize: 10,
            color: '#e05050',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
          }}>
            <AlertCircle size={11} />
            {error}
          </div>
        )}

        {/* ── VIEW MODE ── */}
        {mode === 'view' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '22px 20px' }}>
            {event.department && (
              <div style={{ marginBottom: 12 }}>
                <span style={{
                  fontSize: 8,
                  fontWeight: 700,
                  padding: '3px 9px',
                  background: `${accentColor}1a`,
                  color: accentColor,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  border: `1px solid ${accentColor}40`,
                }}>
                  {event.department}
                </span>
              </div>
            )}

            <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2 }}>
              {event.title}
            </h2>

            {event.description && (
              <p style={{ margin: '0 0 18px', fontSize: 11, color: 'var(--mid)', lineHeight: 1.7, borderBottom: '1px solid var(--rule)', paddingBottom: 18 }}>
                {event.description}
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: event.description ? 0 : 16 }}>
              <Row icon={<Calendar size={13} strokeWidth={1.8} color="var(--mid)" />}>
                {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                })}
              </Row>

              <Row icon={<Clock size={13} strokeWidth={1.8} color="var(--mid)" />}>
                {formatEventTime(event.time)}
                {event.duration_minutes ? <span style={{ color: 'var(--mid)', marginLeft: 6 }}>· {event.duration_minutes} min</span> : null}
              </Row>

              {event.location && (
                <Row icon={<MapPin size={13} strokeWidth={1.8} color="var(--mid)" />}>
                  {event.location}
                </Row>
              )}

              {event.meeting_link && (
                <Row icon={<LinkIcon size={13} strokeWidth={1.8} color="var(--mid)" />}>
                  <a
                    href={event.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 700, fontSize: 11 }}
                  >
                    Join Meeting →
                  </a>
                </Row>
              )}

              {event.assigned_to && event.assigned_to.length > 0 && (
                <Row icon={<Users size={13} strokeWidth={1.8} color="var(--mid)" />}>
                  {event.assigned_to.length} attendee{event.assigned_to.length !== 1 ? 's' : ''}
                </Row>
              )}
            </div>

            <div style={{ marginTop: 28, paddingTop: 14, borderTop: '1px solid var(--rule)', fontSize: 8, color: 'var(--mid)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Created {new Date(event.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        )}

        {/* ── EDIT MODE ── */}
        {mode === 'edit' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={label}>Title *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} style={input} autoFocus
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--rule)')} />
            </div>

            <div>
              <label style={label}>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                style={{ ...input, minHeight: 70, resize: 'vertical' }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--rule)')} />
            </div>

            <div>
              <label style={label}>Department</label>
              <select value={department} onChange={e => setDepartment(e.target.value)}
                style={{ ...input, cursor: 'pointer' }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--rule)')}>
                <option value="">All Departments</option>
                {DEPARTMENTS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
              </select>
            </div>

            <div>
              <label style={label}>Date</label>
              <MiniCalendar value={date} onChange={setDate} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={label}>Time</label>
                <input type="time" value={time} onChange={e => setTime(e.target.value)} style={input}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--rule)')} />
              </div>
              <div>
                <label style={label}>Duration (min)</label>
                <input type="number" min="15" step="15" value={duration} onChange={e => setDuration(e.target.value)} style={input}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--rule)')} />
              </div>
            </div>

            <div>
              <label style={label}>Location</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} style={input}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--rule)')} />
            </div>

            <div>
              <label style={label}>Meeting Link</label>
              <input type="url" value={meetingLink} onChange={e => setMeetingLink(e.target.value)}
                style={{ ...input, fontFamily: 'var(--ff-mono)', fontSize: 10 }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--rule)')} />
            </div>

            <div>
              <label style={label}>Attendees</label>
              <MultiPersonSelect
                selectedIds={selectedUsers}
                onChange={setSelectedUsers}
                placeholder="Search team members…"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        {mode === 'edit' && (
          <div style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--rule)',
            flexShrink: 0,
            display: 'flex',
            gap: 8,
          }}>
            <button
              onClick={handleSave}
              disabled={loading}
              className="db-btn"
              style={{ flex: 1, justifyContent: 'center', opacity: loading ? 0.6 : 1 }}
            >
              <Check size={10} strokeWidth={2.5} />
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              onClick={() => { setMode('view'); setError(null); }}
              className="db-ghost"
              style={{ padding: '9px 16px', fontSize: 9, fontWeight: 700 }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}

// Small helper to keep view rows consistent
function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 11, color: 'var(--ink)' }}>
      <span style={{ flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <span>{children}</span>
    </div>
  );
}