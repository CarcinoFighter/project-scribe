'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail, Lock, Loader2, ArrowRight, Eye, EyeOff, Sun, Moon,
  PenTool, Palette, Code2, Megaphone, Users,
} from 'lucide-react';
import { loadSettings, applySettings, saveSettings, THEMES } from '@/components/SettingsModal';

/* ─── Department data ──────────────────────────────────────────── */
const DEPTS = [
  { name: "Writers' Block",   Icon: PenTool,    color: '#f59e0b', glow: 'rgba(245,158,11,0.35)'  },
  { name: 'Design Lab',       Icon: Palette,    color: '#3b82f6', glow: 'rgba(59,130,246,0.35)'  },
  { name: 'Development',      Icon: Code2,      color: '#10b981', glow: 'rgba(16,185,129,0.35)'  },
  { name: 'Public Relations', Icon: Megaphone,  color: '#ec4899', glow: 'rgba(236,72,153,0.35)'  },
  { name: 'Leadership',       Icon: Users,      color: '#8b5cf6', glow: 'rgba(139,92,246,0.35)'  },
];

/* ─── Paired theme maps (mirrors useTheme hook) ─────────────────── */
const DARK_TO_LIGHT: Record<string, string> = {
  'default-dark':     'default-light',
  'catppuccin-mocha': 'catppuccin-latte',
  'solarized-dark':   'solarized-light',
  'gruvbox-dark':     'gruvbox-light',
};
const LIGHT_TO_DARK: Record<string, string> = Object.fromEntries(
  Object.entries(DARK_TO_LIGHT).map(([k, v]) => [v, k])
);

/* ─── Logo SVG ─────────────────────────────────────────────────── */
function Logo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 1.2)} viewBox="0 0 20 24" fill="none" aria-hidden>
      <path d="M9.13307 5.97435C9.21934 5.23291 9.33279 4.80925 9.89802 4.0092C10.9029 2.80263 11.6709 2.67501 12.9912 2.4556L13.0042 2.45344C14.8586 2.34816 15.7395 3.26056 16.1799 4.26653C16.6203 5.27251 16.5553 7.03881 16.4233 7.9863C16.2913 8.93378 15.7627 11.4166 12.7608 13.8614C13.5837 14.1538 13.6573 14.1074 14.65 14.2561C15.6004 13.2384 16.1436 12.4864 17.5128 10.8405C18.882 9.19453 19.661 6.91014 19.8772 5.50646C20.0934 4.10278 20.1438 2.45344 18.9963 1.26031C17.8489 0.0671784 15.5888 -0.131673 14.198 0.067179C12.8072 0.266031 10.3732 1.26031 8.68105 2.6289C6.98888 3.9975 6.20076 5.50646 5.57488 7.5418C4.949 9.57714 5.30938 11.2467 6.08485 13.332C7.40174 16.0707 9.01717 17.9291 10.4196 18.8415C11.822 19.7539 12.8072 20.2451 14.3487 22.842C16.2495 19.8123 16.9991 18.6706 18.4632 16.9465C17.5128 15.7767 16.2842 15.1142 13.8735 14.7825C11.4627 14.4508 10.6865 13.6665 10.2341 13.6478C9.78183 13.6291 9.26057 13.6244 9.09831 13.5776C8.93605 13.5309 8.89093 13.5242 8.76218 13.2384C8.62326 12.7331 8.76218 11.9985 8.76218 11.8932C8.76218 11.7879 8.54197 11.6476 8.54197 11.5072C8.54197 11.3668 8.61607 11.2835 8.77377 11.2031C8.77377 11.2031 8.41448 11.0042 8.41448 10.8405C8.41448 10.6767 8.57673 10.0567 8.54197 9.91637C8.50721 9.776 7.68429 9.60054 7.83497 9.3198C7.98565 9.03906 9.16153 7.60314 9.30692 7.30785C9.45232 7.01256 9.15359 6.6787 9.13307 5.97435Z" fill="var(--accent)"/>
      <path d="M8.00883 18.0928C5.32942 19.6789 3.54237 20.5984 1.2981 21.2277L0 24C1.2981 23.9064 5.74874 21.7424 9.23739 19.169L8.00883 18.0928Z" fill="var(--accent)"/>
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [ready,    setReady]    = useState(false);
  const [isDark,   setIsDark]   = useState(true);
  const [tick,     setTick]     = useState(0);

  /* Apply saved theme on mount — same system used everywhere else */
  useEffect(() => {
    const s = loadSettings();
    const dark = applySettings(s);
    setIsDark(dark);
    setReady(true);
    const id = setInterval(() => setTick(t => (t + 1) % DEPTS.length), 1600);
    return () => clearInterval(id);
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
      const res  = await fetch('/api/auth/login', {
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

  const activeDept = DEPTS[tick];

  return (
    <>
      <style>{`
        @keyframes lp-spin    { to { transform: rotate(360deg); } }
        @keyframes lp-shake   { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
        @keyframes lp-shim    { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes lp-blink   { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes lp-fade-up { from{opacity:0;transform:translateY(20px) scale(0.99)} to{opacity:1;transform:none} }
        @keyframes lp-slide-x { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:none} }
        @keyframes lp-spin-cw  { to{transform:rotate(360deg)}  }
        @keyframes lp-spin-ccw { to{transform:rotate(-360deg)} }
        @keyframes lp-grad { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }

        .lp-card-ready { animation: lp-fade-up 0.55s cubic-bezier(0.22,1,0.36,1) both; }
        .lp-hero-anim  { animation: lp-slide-x 0.70s cubic-bezier(0.22,1,0.36,1) both; }
        .lp-hero-anim:nth-child(2) { animation-delay: 0.06s; }
        .lp-hero-anim:nth-child(3) { animation-delay: 0.12s; }
        .lp-hero-anim:nth-child(4) { animation-delay: 0.18s; }
        .lp-shake { animation: lp-shake 0.34s ease; }

        .lp-em {
          font-style:italic; font-weight:800; font-size:1.06em;
          background: linear-gradient(90deg, #f59e0b, #3b82f6, #10b981, #ec4899, #8b5cf6);
          background-size:300% 300%;
          -webkit-background-clip:text; -webkit-text-fill-color:transparent;
          color:transparent;
          animation: lp-grad 5.5s ease infinite;
        }

        /* Shimmer rim on card panel */
        .lp-panel::before {
          content:''; position:absolute; top:0; left:0; right:0; height:1px;
          background: linear-gradient(90deg,
            transparent 0%, rgba(143,107,187,0.55) 35%,
            rgba(200,168,235,0.90) 50%, rgba(143,107,187,0.55) 65%, transparent 100%);
          background-size:200% 100%;
          animation: lp-shim 3.6s ease-in-out infinite;
        }

        /* Input focus — uses design-system accent token */
        .lp-inp:focus {
          border-color: var(--accent) !important;
          background: var(--accent-subtle) !important;
          box-shadow: 0 0 0 3px var(--accent-subtle) !important;
          outline: none;
        }
        .lp-inp::placeholder { color: var(--text-4); opacity: 0.55; }

        /* Orbital ring anims */
        .lp-r1 { transform-origin:250px 250px; animation: lp-spin-cw  88s linear infinite; }
        .lp-r2 { transform-origin:250px 250px; animation: lp-spin-ccw 55s linear infinite; }
        .lp-r3 { transform-origin:250px 250px; animation: lp-spin-cw  36s linear infinite; }
        .lp-r4 { transform-origin:250px 250px; animation: lp-spin-ccw 22s linear infinite; }

        /* CTA button hover */
        .lp-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 32px var(--accent-glow) !important;
        }
        .lp-btn:active:not(:disabled) { transform: translateY(0); }

        /* Mobile layout */
        @media (max-width: 860px) {
          .lp-left  { display: none !important; }
          .lp-root  { grid-template-columns: 1fr !important; }
          .lp-right { grid-column: 1 / -1; }
          .lp-mobile-brand { display: flex !important; }
        }
      `}</style>

      {/* Root two-column grid */}
      <div
        className="lp-root"
        style={{
          minHeight: '100dvh',
          display: 'grid',
          gridTemplateColumns: '1.15fr 0.85fr',
          background: 'var(--bg)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'background 0.4s',
        }}
      >
        {/* ══ LEFT ═════════════════════════════════════════════════ */}
        <div
          className="lp-left"
          style={{
            position: 'relative',
            overflow: 'hidden',
            background: 'var(--bg-alt)',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-evenly',
            alignItems: 'flex-start',
            padding: '36px 44px',
            minHeight: '100dvh',
          }}
        >
          {/* Corner reticles */}
          {(['tl','tr','bl','br'] as const).map(pos => (
            <span key={pos} aria-hidden style={{
              position: 'absolute',
              width: 18, height: 18,
              top:    pos[0]==='t' ? 20 : undefined,
              bottom: pos[0]==='b' ? 20 : undefined,
              left:   pos[1]==='l' ? 20 : undefined,
              right:  pos[1]==='r' ? 20 : undefined,
              borderColor: 'var(--accent)',
              opacity: 0.22,
              borderStyle: 'solid',
              borderWidth:
                pos==='tl' ? '1px 0 0 1px' :
                pos==='tr' ? '1px 1px 0 0' :
                pos==='bl' ? '0 0 1px 1px' :
                             '0 1px 1px 0',
            }}/>
          ))}

          {/* Orbital */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -52%)',
            width: 'min(500px, 86%)',
            zIndex: 0, pointerEvents: 'none',
          }}>
            <svg viewBox="0 0 500 500" width="100%" height="100%" overflow="visible" aria-hidden>
              <g className="lp-r1"><circle cx="250" cy="250" r="170" fill="none" stroke="var(--accent)" strokeWidth="0.5" strokeOpacity="0.13" strokeDasharray="6 10"/></g>
              <g className="lp-r2"><circle cx="250" cy="250" r="130" fill="none" stroke="var(--accent)" strokeWidth="0.5" strokeOpacity="0.09" strokeDasharray="4 16"/></g>
              <g className="lp-r3"><circle cx="250" cy="250" r="90"  fill="none" stroke="var(--accent)" strokeWidth="0.5" strokeOpacity="0.14" strokeDasharray="2 10"/></g>
              <g className="lp-r4"><circle cx="250" cy="250" r="55"  fill="none" stroke="var(--accent)" strokeWidth="0.5" strokeOpacity="0.10" strokeDasharray="3 8"/></g>
              <circle cx="250" cy="250" r="6" fill="var(--accent)" fillOpacity="0.25"/>
              <circle cx="250" cy="250" r="3" fill="var(--accent)" fillOpacity="0.65"/>
              {DEPTS.map((dept, i) => {
                const angle = (i / DEPTS.length) * 2 * Math.PI - Math.PI / 2;
                const cx = 250 + 170 * Math.cos(angle);
                const cy = 250 + 170 * Math.sin(angle);
                const isActive = tick === i;
                return (
                  <g key={dept.name}>
                    {isActive && (
                      <circle cx={cx} cy={cy} r="7" fill={dept.color} fillOpacity="0.25">
                        <animate attributeName="r" from="7" to="28" dur="1.4s" repeatCount="indefinite"/>
                        <animate attributeName="opacity" from="0.5" to="0" dur="1.4s" repeatCount="indefinite"/>
                      </circle>
                    )}
                    <circle cx={cx} cy={cy}
                      r={isActive ? 7 : 5}
                      fill={dept.color}
                      fillOpacity={isActive ? 0.9 : 0.38}
                      style={{ transition: 'r 0.4s, fill-opacity 0.4s' }}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Brand */}
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Logo size={16}/>
            <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-4)' }}>
              Carcino Vantage
            </span>
          </div>

          {/* Hero */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div className="lp-hero-anim" style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase',
              color: 'var(--accent)', opacity: 0.72, marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ width: 22, height: 1, background: 'var(--accent)', opacity: 0.6, flexShrink: 0, display:'inline-block' }}/>
              The Carcino Foundation
            </div>

            <h1 className="lp-hero-anim" style={{
              fontSize: 'clamp(30px, 4.2vw, 56px)',
              fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.05,
              color: 'var(--text)', marginBottom: 14,
            }}>
              One workspace.<br/>
              <span className="lp-em">Every department.</span>
            </h1>

            <p className="lp-hero-anim" style={{
              fontSize: 13, lineHeight: 1.72, color: 'var(--text-4)',
              maxWidth: 300, marginBottom: 24,
            }}>
              Writers, designers, developers, PR, and leadership — unified in one platform,
              built for work that matters.
            </p>

            {/* Dept chips */}
            <div className="lp-hero-anim" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {DEPTS.map((dept, i) => (
                <span key={dept.name} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 11px 4px 8px', borderRadius: 99,
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.01em',
                  border: '1px solid',
                  borderColor: tick === i ? dept.color + '44' : dept.color + '1e',
                  background: tick === i ? dept.color + '14' : dept.color + '08',
                  color: dept.color,
                  opacity: tick === i ? 1 : 0.48,
                  boxShadow: tick === i ? `0 0 10px ${dept.glow}` : 'none',
                  transition: 'opacity 0.35s, box-shadow 0.35s, background 0.35s, border-color 0.35s',
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: dept.color, flexShrink: 0 }}/>
                  {dept.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ══ RIGHT ════════════════════════════════════════════════ */}
        <div
          className="lp-right"
          style={{
            position: 'relative',
            background: 'var(--bg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px clamp(24px, 5vw, 56px)',
            gap: 24,
          }}
        >
          {/* Accent corner glow */}
          <div aria-hidden style={{
            position: 'absolute', top: -80, right: -80,
            width: 320, height: 320, borderRadius: '50%',
            background: 'radial-gradient(circle, var(--accent-subtle) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}/>

          {/* Theme toggle — reuses existing tb-btn class from globals.css */}
          <button
            className="tb-btn"
            onClick={toggleDark}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{ position: 'absolute', top: 18, right: 18, width: 34, height: 34, borderRadius: 8 }}
          >
            {isDark ? <Sun size={14} strokeWidth={1.8}/> : <Moon size={14} strokeWidth={1.8}/>}
          </button>

          {/* Mobile brand */}
          <div className="lp-mobile-brand" style={{ display: 'none', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Logo size={22}/>
            <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text)' }}>
              Carcino Vantage
            </span>
          </div>

          {/* Card */}
          <div
            className={ready ? 'lp-card-ready' : undefined}
            style={{ width: '100%', maxWidth: 384, opacity: ready ? undefined : 0, position: 'relative', zIndex: 2 }}
          >
            {/* Glass panel — consistent with glass-overlay in globals.css */}
            <div
              className="lp-panel"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border-med)',
                borderRadius: 'var(--r-xl)',
                padding: '34px 30px 28px',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                boxShadow: 'var(--sh-lg)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Inner glow overlay */}
              <div aria-hidden style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'radial-gradient(ellipse 80% 38% at 50% 0%, var(--accent-subtle) 0%, transparent 70%)',
              }}/>

              {/* Card header */}
              <div style={{ marginBottom: 24, position: 'relative', zIndex: 1 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 10px', borderRadius: 99, marginBottom: 12,
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                  background: 'var(--accent-subtle2)',
                  border: '1px solid rgba(143,107,187,0.25)',
                  color: 'var(--accent)',
                }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)',
                    animation: 'lp-blink 2s ease-in-out infinite',
                  }}/>
                  Workspace Access
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.022em', color: 'var(--text)', marginBottom: 5 }}>
                  Sign in to Vantage
                </h2>
                <p style={{ fontSize: 12.5, color: 'var(--text-4)' }}>
                  Welcome back — let&apos;s change the world.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div role="alert" aria-live="assertive" className="lp-shake" style={{
                  background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)',
                  borderRadius: 'var(--r-md)', padding: '9px 13px', fontSize: 12, color: '#f87171',
                  marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8,
                  position: 'relative', zIndex: 1,
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} noValidate>
                {/* Email */}
                <div style={{ marginBottom: 11, position: 'relative', zIndex: 1 }}>
                  <label htmlFor="lp-email" style={{
                    display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
                    textTransform: 'uppercase', marginBottom: 7, color: 'var(--text-4)',
                  }}>
                    Email address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={14} strokeWidth={1.8} aria-hidden style={{
                      position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--text-4)', pointerEvents: 'none',
                    }}/>
                    <input
                      id="lp-email" type="email" className="lp-inp"
                      placeholder="you@carcino.work"
                      value={email} onChange={e => setEmail(e.target.value)}
                      autoComplete="email" required aria-required="true" aria-invalid={!!error}
                      style={{
                        width: '100%', background: 'var(--bg-deep)',
                        border: '1px solid var(--border-med)', borderRadius: 'var(--r-md)',
                        padding: '11px 12px 11px 38px', fontFamily: 'inherit', fontSize: 13.5,
                        color: 'var(--text)', transition: 'border-color 0.13s, background 0.13s, box-shadow 0.13s',
                      }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div style={{ marginBottom: 11, position: 'relative', zIndex: 1 }}>
                  <label htmlFor="lp-pw" style={{
                    display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
                    textTransform: 'uppercase', marginBottom: 7, color: 'var(--text-4)',
                  }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={14} strokeWidth={1.8} aria-hidden style={{
                      position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--text-4)', pointerEvents: 'none',
                    }}/>
                    <input
                      id="lp-pw" type={showPw ? 'text' : 'password'} className="lp-inp"
                      placeholder="••••••••••"
                      value={password} onChange={e => setPassword(e.target.value)}
                      autoComplete="current-password" required aria-required="true" aria-invalid={!!error}
                      style={{
                        width: '100%', background: 'var(--bg-deep)',
                        border: '1px solid var(--border-med)', borderRadius: 'var(--r-md)',
                        padding: '11px 40px 11px 38px', fontFamily: 'inherit', fontSize: 13.5,
                        color: 'var(--text)', transition: 'border-color 0.13s, background 0.13s, box-shadow 0.13s',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                      aria-pressed={showPw}
                      style={{
                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: 4, borderRadius: 4, color: 'var(--text-4)',
                        display: 'flex', alignItems: 'center', transition: 'color 0.12s',
                      }}
                    >
                      {showPw ? <EyeOff size={14} aria-hidden/> : <Eye size={14} aria-hidden/>}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="lp-btn"
                  disabled={loading || !email || !password}
                  aria-busy={loading}
                  style={{
                    width: '100%', marginTop: 18, padding: '12px 16px',
                    background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)',
                    border: 'none', borderRadius: 'var(--r-md)',
                    color: '#fff', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700,
                    letterSpacing: '-0.01em', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    position: 'relative', zIndex: 1,
                    boxShadow: '0 4px 20px var(--accent-glow)',
                    opacity: loading || !email || !password ? 0.48 : 1,
                    transition: 'transform 0.10s, box-shadow 0.12s, opacity 0.12s',
                  }}
                >
                  {loading
                    ? <><Loader2 size={15} aria-hidden style={{ animation: 'lp-spin 0.75s linear infinite' }}/><span>Signing in…</span></>
                    : <><span>Sign in</span><ArrowRight size={14} aria-hidden/></>
                  }
                </button>
              </form>

              {/* Active dept ticker */}
              <div style={{
                marginTop: 20, paddingTop: 16,
                borderTop: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 11, color: 'var(--text-4)',
                position: 'relative', zIndex: 1, overflow: 'hidden',
              }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                  background: activeDept.color,
                  boxShadow: `0 0 8px ${activeDept.glow}`,
                  transition: 'background 0.4s ease, box-shadow 0.4s ease',
                }}/>
                <span>
                  <span style={{ fontWeight: 600, color: activeDept.color, transition: 'color 0.4s ease' }}>
                    {activeDept.name}
                  </span>
                  {' '}is active on Vantage
                </span>
              </div>
            </div>

            <footer style={{
              marginTop: 14, textAlign: 'center', fontSize: 10.5,
              color: 'var(--text-4)', opacity: 0.55,
            }}>
              © 2026 The Carcino Foundation · All rights reserved
            </footer>
          </div>
        </div>
      </div>
    </>
  );
}