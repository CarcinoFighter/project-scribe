'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail, Lock, ArrowRight, Eye, EyeOff,
  PenTool, Palette, Code2, Megaphone, Users, Loader2
} from 'lucide-react';
import { DARK_TO_LIGHT, LIGHT_TO_DARK, loadSettings, applySettings, saveSettings, THEMES } from '@/lib/theme';

/* ─── Department data ──────────────────────────────────────────── */
const DEPTS = [
  { name: "Writers' Block", Icon: PenTool, abbr: 'WR', color: '#3b82f6', desc: 'Crafting the voice of tomorrow.' },
  { name: 'Design Lab', Icon: Palette, abbr: 'DS', color: '#f43f5e', desc: 'Shaping visual perfection.' },
  { name: 'Development', Icon: Code2, abbr: 'DV', color: '#10b981', desc: 'Architecting the foundation.' },
  { name: 'Public Relations', Icon: Megaphone, abbr: 'PR', color: '#f59e0b', desc: 'Connecting with the world.' },
  { name: 'Leadership', Icon: Users, abbr: 'LD', color: '#8b5cf6', desc: 'Guiding the vision.' },
];

function Logo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 1.2)} viewBox="0 0 20 24" fill="none" aria-hidden>
      <path d="M9.13307 5.97435C9.21934 5.23291 9.33279 4.80925 9.89802 4.0092C10.9029 2.80263 11.6709 2.67501 12.9912 2.4556L13.0042 2.45344C14.8586 2.34816 15.7395 3.26056 16.1799 4.26653C16.6203 5.27251 16.5553 7.03881 16.4233 7.9863C16.2913 8.93378 15.7627 11.4166 12.7608 13.8614C13.5837 14.1538 13.6573 14.1074 14.65 14.2561C15.6004 13.2384 16.1436 12.4864 17.5128 10.8405C18.882 9.19453 19.661 6.91014 19.8772 5.50646C20.0934 4.10278 20.1438 2.45344 18.9963 1.26031C17.8489 0.0671784 15.5888 -0.131673 14.198 0.067179C12.8072 0.266031 10.3732 1.26031 8.68105 2.6289C6.98888 3.9975 6.20076 5.50646 5.57488 7.5418C4.949 9.57714 5.30938 11.2467 6.08485 13.332C7.40174 16.0707 9.01717 17.9291 10.4196 18.8415C11.822 19.7539 12.8072 20.2451 14.3487 22.842C16.2495 19.8123 16.9991 18.6706 18.4632 16.9465C17.5128 15.7767 16.2842 15.1142 13.8735 14.7825C11.4627 14.4508 10.6865 13.6665 10.2341 13.6478C9.78183 13.6291 9.26057 13.6244 9.09831 13.5776C8.93605 13.5309 8.89093 13.5242 8.76218 13.2384C8.62326 12.7331 8.76218 11.9985 8.76218 11.8932C8.76218 11.7879 8.54197 11.6476 8.54197 11.5072C8.54197 11.3668 8.61607 11.2835 8.77377 11.2031C8.77377 11.2031 8.41448 11.0042 8.41448 10.8405C8.41448 10.6767 8.57673 10.0567 8.54197 9.91637C8.50721 9.776 7.68429 9.60054 7.83497 9.3198C7.98565 9.03906 9.16153 7.60314 9.30692 7.30785C9.45232 7.01256 9.15359 6.6787 9.13307 5.97435Z" fill="currentColor" />
      <path d="M8.00883 18.0928C5.32942 19.6789 3.54237 20.5984 1.2981 21.2277L0 24C1.2981 23.9064 5.74874 21.7424 9.23739 19.169L8.00883 18.0928Z" fill="currentColor" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const s = loadSettings();
    const dark = applySettings(s);
    setIsDark(dark);
    setReady(true);

    const deptId = setInterval(() => setTick(t => (t + 1) % DEPTS.length), 4000);
    return () => clearInterval(deptId);
  }, []);

  const toggleDark = () => {
    const s = loadSettings();
    const curDark = THEMES[s.theme]?.dark ?? isDark;
    const nextTheme = curDark
      ? (DARK_TO_LIGHT[s.theme] ?? 'default-light')
      : (LIGHT_TO_DARK[s.theme] ?? 'default-dark');
    const next = { ...s, theme: nextTheme };
    saveSettings(next);
    setIsDark(applySettings(next));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      router.push('/'); router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const dept = DEPTS[tick];

  return (
    // FIX 1: Added missing closing </div> for the outer grid wrapper
    <div style={{
      minHeight: '100dvh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      background: 'var(--bg-deep)',
      overflow: 'hidden',
    }}>
      {/* FIX 2: Replaced Tailwind `animate-spin` with a CSS keyframes rule,
               and FIX 3: cleaned up template literal backtick escaping in style props */}
      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-30px, 20px) scale(1.05); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -40px) scale(0.95); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, -20px) scale(1.1); }
        }
        @keyframes slideUpFade {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .login-spin {
          animation: spin 1s linear infinite;
        }

        @media (max-width: 900px) {
          .login-grid { grid-template-columns: 1fr !important; }
          .login-hero { display: none !important; }
        }

        .login-input-group {
          position: relative;
          transition: all 0.2s ease;
        }
        .login-input-group:focus-within {
          transform: translateY(-2px);
        }
      `}</style>

      {/* Hero / Brand Side */}
      <div className="login-hero" style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px',
        borderRight: '1px solid var(--border)',
        overflow: 'hidden',
        background: 'var(--bg)',
      }}>
        {/* Animated Orbs */}
        <div style={{
          position: 'absolute', top: '20%', left: '10%', width: '30vw', height: '30vw',
          background: `radial-gradient(circle, ${dept.color} 0%, transparent 60%)`,
          opacity: isDark ? 0.15 : 0.08, filter: 'blur(60px)', mixBlendMode: isDark ? 'screen' : 'multiply',
          animation: 'float1 14s ease-in-out infinite', transition: 'background 1s ease'
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '-10%', width: '40vw', height: '40vw',
          background: 'radial-gradient(circle, var(--accent) 0%, transparent 60%)',
          opacity: isDark ? 0.1 : 0.05, filter: 'blur(80px)', mixBlendMode: isDark ? 'screen' : 'multiply',
          animation: 'float2 18s ease-in-out infinite'
        }} />

        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '60px' }}>
            <div style={{ color: 'var(--accent)' }}><Logo size={32} /></div>
            <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)' }}>
              Carcino Vantage
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(40px, 6vw, 72px)',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.04em',
            color: 'var(--text)',
            marginBottom: 24,
            textWrap: 'balance'
          }}>
            Where great <br />
            ideas <span style={{ color: 'var(--accent)' }}>converge.</span>
          </h1>

          <div style={{
            height: 80,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative'
          }}>
            {DEPTS.map((d, i) => (
              <div
                key={d.name}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  opacity: tick === i ? 1 : 0,
                  transform: tick === i ? 'translateY(0)' : (tick > i || (tick === 0 && i === DEPTS.length - 1) ? 'translateY(-10px)' : 'translateY(10px)'),
                  transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 'var(--r-md)',
                  background: `${d.color}15`, color: d.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <d.Icon size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px 0' }}>{d.name}</h3>
                  <p style={{ fontSize: 14, color: 'var(--text-3)', margin: 0 }}>{d.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Theme Toggle Bottom Left */}
        <div style={{ position: 'absolute', bottom: 40, left: 60, zIndex: 10 }}>
          <button
            onClick={toggleDark}
            style={{
              background: 'var(--surface-1)', border: '1px solid var(--border)', cursor: 'pointer',
              padding: '8px 16px', borderRadius: 'var(--r-pill)', fontSize: 12, fontWeight: 600,
              color: 'var(--text-2)', transition: 'all 0.2s', boxShadow: 'var(--sh-sm)',
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: isDark ? '#f59e0b' : '#3b82f6' }} />
            {isDark ? 'Switch to Light' : 'Switch to Dark'}
          </button>
        </div>
      </div>

      {/* Login Form Side */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        {/* Animated Background Blob for Form */}
        <div style={{
          position: 'absolute', top: '30%', left: '20%', width: '50%', height: '50%',
          background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
          opacity: 0.05, filter: 'blur(40px)', animation: 'float3 10s ease-in-out infinite'
        }} />

        <div
          style={{
            width: '100%', maxWidth: 420,
            background: 'var(--surface-1)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-xl)',
            padding: '48px 40px',
            boxShadow: 'var(--sh-xl)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            opacity: ready ? 1 : 0,
            transform: ready ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
            position: 'relative',
            zIndex: 10
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', margin: '0 0 8px 0', letterSpacing: '-0.03em' }}>
              Welcome back
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-3)', margin: 0 }}>
              Sign in to your workspace account.
            </p>
          </div>

          {error && (
            <div style={{
              marginBottom: 24, padding: '14px 16px', background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--r-md)',
              color: '#ef4444', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10,
              animation: 'slideUpFade 0.3s ease'
            }}>
              <div style={{ background: '#ef4444', color: 'white', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold' }}>!</div>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="login-input-group">
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8, letterSpacing: '0.02em' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@carcino.work"
                  className="db-inp"
                  style={{
                    paddingLeft: 48, height: 50, borderRadius: 'var(--r-md)',
                    fontSize: 15, background: 'var(--surface-2)'
                  }}
                />
              </div>
            </div>

            <div className="login-input-group">
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8, letterSpacing: '0.02em' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="db-inp"
                  style={{
                    paddingLeft: 48, paddingRight: 48, height: 50, borderRadius: 'var(--r-md)',
                    fontSize: 15, background: 'var(--surface-2)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer', padding: 4
                  }}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="db-btn"
              style={{
                marginTop: 12, height: 50, borderRadius: 'var(--r-md)', fontSize: 15,
                fontWeight: 600, display: 'flex', justifyContent: 'center', gap: 10,
                transition: 'all 0.2s ease', boxShadow: 'var(--sh-md)'
              }}
            >
              {loading ? (
                // FIX 3: replaced Tailwind `animate-spin` class with inline CSS animation
                <>Authenticating <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /></>
              ) : (
                <>Sign into Vantage <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          {/* Secure connection indicator */}
          <div style={{
            marginTop: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontSize: 12, color: 'var(--text-3)'
          }}>
            <Lock size={12} />
            <span>Secure connection established</span>
          </div>
        </div>
      </div>
      {/* FIX 1: closing tag for the outer grid wrapper div */}
    </div>
  );
}