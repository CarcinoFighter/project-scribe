'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail, Lock, ArrowRight, Eye, EyeOff,
  PenTool, Palette, Code2, Megaphone, Users,
} from 'lucide-react';
import { loadSettings, applySettings, saveSettings, THEMES } from '@/components/SettingsModal';

/* ─── Department data ──────────────────────────────────────────── */
const DEPTS = [
  { name: "Writers' Block",   Icon: PenTool,   abbr: 'WR' },
  { name: 'Design Lab',       Icon: Palette,   abbr: 'DS' },
  { name: 'Development',      Icon: Code2,     abbr: 'DV' },
  { name: 'Public Relations', Icon: Megaphone, abbr: 'PR' },
  { name: 'Leadership',       Icon: Users,     abbr: 'LD' },
];

/* ─── Theme helpers ─────────────────────────────────────────────── */
const DARK_TO_LIGHT: Record<string, string> = {
  'default-dark':     'default-light',
  'catppuccin-mocha': 'catppuccin-latte',
  'solarized-dark':   'solarized-light',
  'gruvbox-dark':     'gruvbox-light',
};
const LIGHT_TO_DARK: Record<string, string> = Object.fromEntries(
  Object.entries(DARK_TO_LIGHT).map(([k, v]) => [v, k])
);

/* ─── Logo ─────────────────────────────────────────────────────── */
function Logo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 1.2)} viewBox="0 0 20 24" fill="none" aria-hidden>
      <path d="M9.13307 5.97435C9.21934 5.23291 9.33279 4.80925 9.89802 4.0092C10.9029 2.80263 11.6709 2.67501 12.9912 2.4556L13.0042 2.45344C14.8586 2.34816 15.7395 3.26056 16.1799 4.26653C16.6203 5.27251 16.5553 7.03881 16.4233 7.9863C16.2913 8.93378 15.7627 11.4166 12.7608 13.8614C13.5837 14.1538 13.6573 14.1074 14.65 14.2561C15.6004 13.2384 16.1436 12.4864 17.5128 10.8405C18.882 9.19453 19.661 6.91014 19.8772 5.50646C20.0934 4.10278 20.1438 2.45344 18.9963 1.26031C17.8489 0.0671784 15.5888 -0.131673 14.198 0.067179C12.8072 0.266031 10.3732 1.26031 8.68105 2.6289C6.98888 3.9975 6.20076 5.50646 5.57488 7.5418C4.949 9.57714 5.30938 11.2467 6.08485 13.332C7.40174 16.0707 9.01717 17.9291 10.4196 18.8415C11.822 19.7539 12.8072 20.2451 14.3487 22.842C16.2495 19.8123 16.9991 18.6706 18.4632 16.9465C17.5128 15.7767 16.2842 15.1142 13.8735 14.7825C11.4627 14.4508 10.6865 13.6665 10.2341 13.6478C9.78183 13.6291 9.26057 13.6244 9.09831 13.5776C8.93605 13.5309 8.89093 13.5242 8.76218 13.2384C8.62326 12.7331 8.76218 11.9985 8.76218 11.8932C8.76218 11.7879 8.54197 11.6476 8.54197 11.5072C8.54197 11.3668 8.61607 11.2835 8.77377 11.2031C8.77377 11.2031 8.41448 11.0042 8.41448 10.8405C8.41448 10.6767 8.57673 10.0567 8.54197 9.91637C8.50721 9.776 7.68429 9.60054 7.83497 9.3198C7.98565 9.03906 9.16153 7.60314 9.30692 7.30785C9.45232 7.01256 9.15359 6.6787 9.13307 5.97435Z" fill="currentColor"/>
      <path d="M8.00883 18.0928C5.32942 19.6789 3.54237 20.5984 1.2981 21.2277L0 24C1.2981 23.9064 5.74874 21.7424 9.23739 19.169L8.00883 18.0928Z" fill="currentColor"/>
    </svg>
  );
}

/* ─── Marquee tape ─────────────────────────────────────────────── */
const TAPE_ITEMS = ['WRITERS', 'DESIGN', 'DEV', 'PR', 'LEADERSHIP', 'VANTAGE', '2026', '✦'];

export default function LoginPage() {
  const router   = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [ready,    setReady]    = useState(false);
  const [isDark,   setIsDark]   = useState(true);
  const [tick,     setTick]     = useState(0);
  const [time,     setTime]     = useState('');
  const shakeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = loadSettings();
    const dark = applySettings(s);
    setIsDark(dark);
    setReady(true);

    const deptId = setInterval(() => setTick(t => (t + 1) % DEPTS.length), 2200);

    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    };
    updateTime();
    const clockId = setInterval(updateTime, 1000);

    return () => { clearInterval(deptId); clearInterval(clockId); };
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
      // trigger shake
      if (shakeRef.current) {
        shakeRef.current.classList.remove('lp-shake');
        void shakeRef.current.offsetWidth;
        shakeRef.current.classList.add('lp-shake');
      }
    } finally {
      setLoading(false);
    }
  };

  const dept = DEPTS[tick];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Google+Sans+Flex:ital,wght@0,700;0,900;1,700&family=DM+Mono:wght@400;500&display=swap');

        :root {
          --ink:   #0a0a0a;
          --cream: #f5f0e8;
          --paper: #faf7f2;
          --mid:   #b8b0a0;
          --red:   #9875c1;
          --rule:  rgba(0,0,0,0.12);
        }

        [data-theme*="dark"] {
          --ink:   #f0ece4;
          --cream: #141210;
          --paper: #1a1714;
          --mid:   #6a6460;
          --red:   #aa7fdb;
          --rule:  rgba(255,255,255,0.1);
        }

        /* Detect system: fallback for when SettingsModal applies dark via html class */
        html.dark {
          --ink:   #f0ece4;
          --cream: #141210;
          --paper: #1a1714;
          --mid:   #6a6460;
          --red:   #aa7fdb;
          --rule:  rgba(255,255,255,0.1);
        }

        @keyframes lp-march    { to { stroke-dashoffset: -20; } }
        @keyframes lp-shake    { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
        @keyframes lp-scroll   { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes lp-rise     { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes lp-blink-r  { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes lp-cursor   { 0%,100%{opacity:1} 51%{opacity:0} }
        @keyframes lp-spin     { to{transform:rotate(360deg)} }
        @keyframes lp-flicker  { 0%,100%{opacity:1} 92%{opacity:0.95} 94%{opacity:0.7} 96%{opacity:0.9} }

        .lp-shake { animation: lp-shake 0.42s ease; }

        .lp-ready { animation: lp-rise 0.6s cubic-bezier(0.22,1,0.36,1) both; }
        .lp-ready-1 { animation: lp-rise 0.6s 0.05s cubic-bezier(0.22,1,0.36,1) both; }
        .lp-ready-2 { animation: lp-rise 0.6s 0.12s cubic-bezier(0.22,1,0.36,1) both; }
        .lp-ready-3 { animation: lp-rise 0.6s 0.20s cubic-bezier(0.22,1,0.36,1) both; }

        .lp-march line {
          stroke-dasharray: 4 4;
          animation: lp-march 0.6s linear infinite;
        }

        .lp-tape-track {
          display: flex;
          width: max-content;
          animation: lp-scroll 22s linear infinite;
        }

        .lp-inp {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1.5px solid var(--rule);
          padding: 9px 32px 9px 0;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          color: var(--ink);
          outline: none;
          transition: border-color 0.15s;
          letter-spacing: 0.04em;
        }
        .lp-inp:focus { border-color: var(--red); }
        .lp-inp::placeholder { color: var(--mid); opacity: 0.7; }

        .lp-submit {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 14px 18px;
          background: var(--ink);
          color: var(--cream);
          border: none;
          cursor: pointer;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          transition: background 0.15s;
          clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%);
          position: relative;
          overflow: hidden;
        }
        .lp-submit::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--red);
          transform: translateX(-105%);
          transition: transform 0.28s cubic-bezier(0.22,1,0.36,1);
        }
        .lp-submit:hover:not(:disabled)::before { transform: translateX(0); }
        .lp-submit span, .lp-submit svg { position: relative; z-index: 1; }
        .lp-submit:disabled { opacity: 0.4; cursor: not-allowed; }

        .lp-col-label {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--mid);
        }

        @media (max-width: 860px) {
          .lp-left { display: none !important; }
          .lp-root { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div
        className="lp-root"
        style={{
          minHeight: '100dvh',
          display: 'grid',
          gridTemplateColumns: '1.1fr 0.9fr',
          background: 'var(--paper)',
          fontFamily: "'DM Mono', monospace",
          position: 'relative',
        }}
      >

        {/* ══ LEFT EDITORIAL PANEL ═══════════════════════════════ */}
        <div
          className="lp-left"
          style={{
            position: 'relative',
            borderRight: '1px solid var(--rule)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minHeight: '100dvh',
          }}
        >
          {/* Newspaper header bar */}
          <div style={{
            borderBottom: '1px solid var(--rule)',
            padding: '0 32px',
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            height: 48,
          }}>
            <span className="lp-col-label">Vol. I · No. 1</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink)' }}>
              <Logo size={14}/>
              <span style={{ fontFamily: "'Google Sans Flex', Google Sans, serif", fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em' }}>
                The Carcino Foundation
              </span>
            </div>
            <span className="lp-col-label" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {time || '——:——:——'}
            </span>
          </div>

          {/* Three-rule headline divider */}
          <div style={{ padding: '0 32px' }}>
            {[1, 2.5, 1].map((w, i) => (
              <div key={i} style={{ height: w, background: i === 1 ? 'var(--ink)' : 'var(--rule)', margin: i === 1 ? '2px 0' : 0 }}/>
            ))}
          </div>

          {/* Giant headline */}
          <div style={{
            padding: '24px 32px 20px',
            borderBottom: '1px solid var(--rule)',
            flex: '0 0 auto',
          }}>
            <div className="lp-col-label" style={{ marginBottom: 12 }}>
              ✦ &nbsp;Workspace platform — all departments
            </div>
            <h1 style={{
              fontFamily: "'Google Sans Flex', Georgia, serif",
              fontSize: 'clamp(42px, 5.5vw, 74px)',
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: '-0.03em',
              color: 'var(--ink)',
              margin: 0,
              textWrap: 'balance',
            }}>
              One<br/>
              <span style={{ fontStyle: 'italic', color: 'var(--red)' }}>workspace,</span><br/>
              every<br/>
              team.
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--rule)' }}/>
              <span className="lp-col-label">est. 2026</span>
              <div style={{ flex: 1, height: 1, background: 'var(--rule)' }}/>
            </div>
          </div>

          {/* Department index */}
          <div style={{
            padding: '20px 32px',
            borderBottom: '1px solid var(--rule)',
            flex: '0 0 auto',
          }}>
            <div className="lp-col-label" style={{ marginBottom: 14 }}>Departments</div>
            {DEPTS.map((d, i) => (
              <div key={d.name} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '9px 0',
                borderTop: '1px solid var(--rule)',
                transition: 'all 0.3s',
              }}>
                <span style={{
                  fontFamily: "'Google Sans Flex', serif",
                  fontSize: 10,
                  fontStyle: 'italic',
                  color: tick === i ? 'var(--red)' : 'var(--mid)',
                  width: 24,
                  transition: 'color 0.3s',
                }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <d.Icon
                  size={12}
                  strokeWidth={1.8}
                  style={{ color: tick === i ? 'var(--red)' : 'var(--mid)', transition: 'color 0.3s', flexShrink: 0 }}
                />
                <span style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  letterSpacing: '0.06em',
                  color: tick === i ? 'var(--ink)' : 'var(--mid)',
                  fontWeight: tick === i ? 500 : 400,
                  flex: 1,
                  transition: 'color 0.3s, font-weight 0.3s',
                }}>
                  {d.name.toUpperCase()}
                </span>
                {tick === i && (
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 9, letterSpacing: '0.1em', color: 'var(--red)',
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--red)', animation: 'lp-blink-r 1s step-start infinite' }}/>
                    LIVE
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Marching-ants bottom fill */}
          <div style={{ flex: 1, padding: '16px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <p style={{
              fontFamily: "'Google Sans Flex', Georgia, serif",
              fontSize: 12,
              fontStyle: 'italic',
              color: 'var(--mid)',
              lineHeight: 1.8,
              maxWidth: 300,
              marginBottom: 24,
            }}>
              "Built for work that matters — writers, designers, developers, communications,
              and leadership, unified in one place."
            </p>
            <svg className="lp-march" width="100%" height="12" style={{ opacity: 0.25 }} aria-hidden>
              <line x1="0" y1="6" x2="100%" y2="6" stroke="var(--ink)" strokeWidth="1.5"/>
            </svg>
          </div>

          {/* Tape marquee */}
          <div style={{
            borderTop: '1px solid var(--rule)',
            background: 'var(--ink)',
            overflow: 'hidden',
            height: 34,
            display: 'flex',
            alignItems: 'center',
          }}>
            <div className="lp-tape-track">
              {[...TAPE_ITEMS, ...TAPE_ITEMS].map((item, i) => (
                <span key={i} style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 9.5,
                  letterSpacing: '0.18em',
                  color: i % 8 === 7 || (i - 7) % 8 === 0 ? 'var(--red)' : 'var(--cream)',
                  opacity: 0.7,
                  padding: '0 18px',
                  whiteSpace: 'nowrap',
                }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ══ RIGHT FORM PANEL ════════════════════════════════════ */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            justifyContent: 'center',
            padding: '0',
            minHeight: '100dvh',
            background: 'var(--paper)',
          }}
        >
          {/* Top strip */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            borderBottom: '1px solid var(--rule)',
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 36px',
          }}>
            <span className="lp-col-label">Access terminal</span>
            <button
              onClick={toggleDark}
              aria-label={isDark ? 'Light mode' : 'Dark mode'}
              style={{
                background: 'none', border: '1px solid var(--rule)',
                cursor: 'pointer', padding: '4px 10px',
                fontFamily: "'DM Mono', monospace",
                fontSize: 9, letterSpacing: '0.12em',
                color: 'var(--mid)', textTransform: 'uppercase',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--ink)'; (e.currentTarget as HTMLElement).style.color = 'var(--ink)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--rule)'; (e.currentTarget as HTMLElement).style.color = 'var(--mid)'; }}
            >
              {isDark ? 'Light' : 'Dark'}
            </button>
          </div>

          {/* Form area */}
          <div
            style={{
              padding: '0 clamp(28px, 6vw, 60px)',
              width: '100%',
              maxWidth: 440,
              margin: '0 auto',
              opacity: ready ? 1 : 0,
              transition: 'opacity 0.4s',
            }}
          >
            {/* Section header */}
            <div className="lp-ready" style={{ marginBottom: 36 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
              }}>
                <div style={{ width: 28, height: 28, background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Logo size={13}/>
                </div>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink)', fontWeight: 500 }}>
                  Carcino Vantage
                </span>
              </div>

              <h2 style={{
                fontFamily: "'Google Sans Flex', Georgia, serif",
                fontSize: 'clamp(26px, 3.5vw, 40px)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: 1.05,
                color: 'var(--ink)',
                margin: '0 0 8px',
              }}>
                Sign in<span style={{ color: 'var(--red)' }}>.</span>
              </h2>
              <p style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: 'var(--mid)',
                letterSpacing: '0.04em',
                margin: 0,
              }}>
                Welcome back — let's change the world
              </p>
            </div>

            {/* Error */}
            {error && (
              <div
                ref={shakeRef}
                role="alert"
                style={{
                  marginBottom: 20,
                  padding: '10px 14px',
                  borderLeft: '3px solid var(--red)',
                  background: 'rgba(217,43,43,0.05)',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  color: 'var(--red)',
                  letterSpacing: '0.03em',
                }}
              >
                ✕ &nbsp;{error}
              </div>
            )}

            <form onSubmit={handleLogin} noValidate>
              {/* Email field */}
              <div className="lp-ready-1" style={{ marginBottom: 28 }}>
                <label
                  htmlFor="lp-email"
                  className="lp-col-label"
                  style={{ display: 'block', marginBottom: 8 }}
                >
                  Email address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={12}
                    strokeWidth={1.8}
                    aria-hidden
                    style={{
                      position: 'absolute', left: 0, top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--mid)', pointerEvents: 'none',
                    }}
                  />
                  <input
                    id="lp-email"
                    type="email"
                    className="lp-inp"
                    placeholder="you@carcino.work"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    aria-required="true"
                    aria-invalid={!!error}
                    style={{ paddingLeft: 22 }}
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="lp-ready-2" style={{ marginBottom: 36 }}>
                <label
                  htmlFor="lp-pw"
                  className="lp-col-label"
                  style={{ display: 'block', marginBottom: 8 }}
                >
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={12}
                    strokeWidth={1.8}
                    aria-hidden
                    style={{
                      position: 'absolute', left: 0, top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--mid)', pointerEvents: 'none',
                    }}
                  />
                  <input
                    id="lp-pw"
                    type={showPw ? 'text' : 'password'}
                    className="lp-inp"
                    placeholder="••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    aria-required="true"
                    aria-invalid={!!error}
                    style={{ paddingLeft: 22, paddingRight: 28 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    aria-pressed={showPw}
                    style={{
                      position: 'absolute', right: 0, top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none',
                      cursor: 'pointer', padding: 2,
                      color: 'var(--mid)', display: 'flex', alignItems: 'center',
                    }}
                  >
                    {showPw ? <EyeOff size={12} aria-hidden/> : <Eye size={12} aria-hidden/>}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div className="lp-ready-3">
                <button
                  type="submit"
                  className="lp-submit"
                  disabled={loading || !email || !password}
                  aria-busy={loading}
                >
                  <span>
                    {loading ? 'Authenticating…' : '✦ Sign in to Vantage'}
                  </span>
                  {loading
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'lp-spin 0.8s linear infinite' }} aria-hidden><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                    : <ArrowRight size={14} aria-hidden/>
                  }
                </button>
              </div>
            </form>

            {/* Status line */}
            <div style={{
              marginTop: 28,
              paddingTop: 16,
              borderTop: '1px solid var(--rule)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9.5,
                letterSpacing: '0.1em',
                color: 'var(--mid)',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--red)', display: 'inline-block', animation: 'lp-blink-r 1.4s step-start infinite' }}/>
                {dept.name} — active
              </span>
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9.5,
                letterSpacing: '0.08em',
                color: 'var(--mid)',
              }}>
                {dept.abbr}
              </span>
            </div>
          </div>

          {/* Bottom copyright strip */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            borderTop: '1px solid var(--rule)',
            height: 36,
            display: 'flex',
            alignItems: 'center',
            padding: '0 36px',
          }}>
            <span className="lp-col-label">
              © 2026 The Carcino Foundation · All rights reserved
            </span>
          </div>
        </div>
      </div>
    </>
  );
}