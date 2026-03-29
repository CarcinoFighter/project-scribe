'use client';

import React, { useState } from 'react';
import { X, User, Mail, Shield, Briefcase, Lock, Loader2 } from 'lucide-react';

interface InviteUserModalProps {
  onClose: () => void;
  onSuccess: (user: any) => void;
}

const DEPARTMENTS = [
  "Leadership",
  "Writers' Block",
  "Public Relations",
  "Design Lab",
  "Development",
  "Other",
];

export default function InviteUserModal({ onClose, onSuccess }: InviteUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    position: '',
    department: 'Leadership',
    admin_access: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to invite user');

      onSuccess(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 20
    }}>
      <div className="modal-content db-rise-0" style={{
        background: 'var(--paper)', border: '1px solid var(--rule)', width: '100%', maxWidth: 440,
        position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--ff-display)', fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
              Invite Member<em>.</em>
            </h2>
            <p style={{ fontFamily: 'var(--ff-mono)', fontSize: 9, color: 'var(--mid)', letterSpacing: '0.04em', marginTop: 2 }}>
              ADD NEW PERSONNEL TO THE CARCINO FOUNDATION
            </p>
          </div>
          <button onClick={onClose} className="db-icon-btn">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{ padding: '10px 12px', background: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', fontFamily: 'var(--ff-mono)', fontSize: 10 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Name */}
            <div className="form-group">
              <label className="db-sidebar-label" style={{ marginBottom: 6, display: 'block' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--mid)' }} />
                <input
                  required
                  type="text"
                  placeholder="John Doe"
                  className="db-input"
                  style={{ width: '100%', paddingLeft: 32 }}
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>

            {/* Username */}
            <div className="form-group">
              <label className="db-sidebar-label" style={{ marginBottom: 6, display: 'block' }}>Username</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--mid)', fontSize: 12, fontFamily: 'var(--ff-mono)' }}>@</span>
                <input
                  required
                  type="text"
                  placeholder="johndoe"
                  className="db-input"
                  style={{ width: '100%', paddingLeft: 28 }}
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="db-sidebar-label" style={{ marginBottom: 6, display: 'block' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--mid)' }} />
              <input
                required
                type="email"
                placeholder="john@carcino.work"
                className="db-input"
                style={{ width: '100%', paddingLeft: 32 }}
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Password */}
            <div className="form-group">
              <label className="db-sidebar-label" style={{ marginBottom: 6, display: 'block' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--mid)' }} />
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  className="db-input"
                  style={{ width: '100%', paddingLeft: 32 }}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>

            {/* Position */}
            <div className="form-group">
              <label className="db-sidebar-label" style={{ marginBottom: 6, display: 'block' }}>Position</label>
              <div style={{ position: 'relative' }}>
                <Briefcase size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--mid)' }} />
                <input
                  required
                  type="text"
                  placeholder="Senior Editor"
                  className="db-input"
                  style={{ width: '100%', paddingLeft: 32 }}
                  value={form.position}
                  onChange={e => setForm({ ...form, position: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Department */}
            <div className="form-group">
              <label className="db-sidebar-label" style={{ marginBottom: 6, display: 'block' }}>Department</label>
              <select
                className="db-input"
                style={{ width: '100%', appearance: 'none' }}
                value={form.department}
                onChange={e => setForm({ ...form, department: e.target.value })}
              >
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Admin Access */}
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={form.admin_access}
                  onChange={e => setForm({ ...form, admin_access: e.target.checked })}
                  style={{ accentColor: 'var(--accent)' }}
                />
                <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--ink)' }}>Grant Admin Access</span>
              </label>
            </div>
          </div>

          <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
              className="db-ghost"
              style={{ flex: 1, padding: '10px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="db-btn"
              style={{ flex: 2, padding: '10px', justifyContent: 'center' }}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : 'Invite Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
