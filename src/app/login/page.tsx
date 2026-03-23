'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff, Sun, Moon } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [ready,    setReady]    = useState(false);
  const [dark,     setDark]     = useState(true);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setDark(mq.matches);
    setReady(true);
    const fn = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

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

  const d = dark;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Space+Grotesk:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lp-root {
          min-height: 100dvh;
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          font-family: 'Space Grotesk', system-ui, sans-serif;
          background: ${d ? '#08080d' : '#f5f3ef'};
          transition: background 0.3s;
        }
        @media (max-width: 760px) {
          .lp-root { grid-template-columns: 1fr; }
          .lp-left { display: none; }
        }

        /* ── Grid lines overlay ── */
        .lp-root::after {
          content: '';
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image:
            linear-gradient(${d ? 'rgba(255,255,255,0.022)' : 'rgba(0,0,0,0.035)'} 1px, transparent 1px),
            linear-gradient(90deg, ${d ? 'rgba(255,255,255,0.022)' : 'rgba(0,0,0,0.035)'} 1px, transparent 1px);
          background-size: 64px 64px;
        }

        /* ═══════════════════════════ LEFT ═══════════════════════════ */
        .lp-left {
          position: relative; overflow: hidden; z-index: 1;
          background: ${d ? '#0d0c12' : '#ede9e0'};
          display: flex; flex-direction: column;
          justify-content: space-between;
          padding: clamp(32px, 4.5vw, 60px);
          border-right: 1px solid ${d ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'};
          transition: background 0.3s, border-color 0.3s;
        }

        /* Diagonal gold accent stripe */
        .lp-left::before {
          content: '';
          position: absolute;
          top: -120px; right: -60px;
          width: 2px; height: 140%;
          background: linear-gradient(to bottom,
            transparent 0%,
            ${d ? 'rgba(212,165,75,0.25)' : 'rgba(180,130,40,0.18)'} 25%,
            ${d ? 'rgba(212,165,75,0.10)' : 'rgba(180,130,40,0.08)'} 60%,
            transparent 100%);
          transform: rotate(-15deg);
          transform-origin: top right;
          pointer-events: none;
        }

        /* Radial glow top-left */
        .lp-left::after {
          content: '';
          position: absolute; top: -80px; left: -80px;
          width: 420px; height: 420px; border-radius: 50%;
          background: radial-gradient(circle,
            ${d ? 'rgba(212,165,75,0.07)' : 'rgba(212,165,75,0.09)'} 0%, transparent 65%);
          pointer-events: none;
        }

        /* Brand */
        .lp-brand {
          position: relative; z-index: 2;
          display: flex; align-items: center; gap: 12px;
        }
        .lp-mark {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          background: ${d ? 'rgba(212,165,75,0.1)' : 'rgba(180,130,40,0.1)'};
          border: 1px solid ${d ? 'rgba(212,165,75,0.22)' : 'rgba(180,130,40,0.22)'};
        }
        .lp-brand-name {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 18px; font-weight: 500; letter-spacing: 0.01em;
          color: ${d ? 'rgba(245,240,230,0.85)' : 'rgba(15,12,8,0.82)'};
        }

        /* Hero section */
        .lp-hero { position: relative; z-index: 2; }
        .lp-eyebrow {
          display: inline-flex; align-items: center; gap: 9px;
          font-size: 10px; font-weight: 500; letter-spacing: 0.18em;
          text-transform: uppercase;
          color: ${d ? 'rgba(212,165,75,0.75)' : 'rgba(160,110,20,0.82)'};
          margin-bottom: 24px;
        }
        .lp-eyebrow-line {
          width: 28px; height: 1px;
          background: ${d ? 'rgba(212,165,75,0.45)' : 'rgba(160,110,20,0.45)'};
        }

        .lp-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(38px, 4.2vw, 62px);
          font-weight: 300;
          line-height: 1.08;
          letter-spacing: -0.01em;
          color: ${d ? 'rgba(245,240,230,0.90)' : 'rgba(15,12,8,0.88)'};
          margin-bottom: 22px;
        }
        .lp-title em {
          font-style: italic;
          font-weight: 300;
          color: ${d ? '#d4a54b' : '#b07820'};
        }
        .lp-title strong {
          font-weight: 600;
        }
        .lp-sub {
          font-size: 13.5px; font-weight: 300; line-height: 1.80;
          max-width: 340px;
          color: ${d ? 'rgba(245,240,230,0.30)' : 'rgba(15,12,8,0.42)'};
          letter-spacing: 0.01em;
        }

        /* Corner ornament */
        .lp-ornament {
          position: absolute; z-index: 2;
          top: 0; right: 0;
          width: 80px; height: 80px;
          border-top: 1px solid ${d ? 'rgba(212,165,75,0.14)' : 'rgba(160,110,20,0.12)'};
          border-right: 1px solid ${d ? 'rgba(212,165,75,0.14)' : 'rgba(160,110,20,0.12)'};
          pointer-events: none;
        }

        /* Stats */
        .lp-stats {
          position: relative; z-index: 2;
          display: flex; gap: 0;
          border-top: 1px solid ${d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'};
          padding-top: 28px;
        }
        .lp-stat {
          flex: 1;
          padding-right: 28px;
        }
        .lp-stat + .lp-stat {
          padding-left: 28px; padding-right: 28px;
          border-left: 1px solid ${d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'};
        }
        .lp-stat:last-child { padding-right: 0; }
        .lp-stat-n {
          font-family: 'Cormorant Garamond', serif;
          font-size: 30px; font-weight: 300; line-height: 1;
          color: ${d ? '#d4a54b' : '#a07020'};
          margin-bottom: 4px;
        }
        .lp-stat-l {
          font-size: 10px; font-weight: 400; letter-spacing: 0.08em;
          color: ${d ? 'rgba(245,240,230,0.28)' : 'rgba(15,12,8,0.38)'};
          text-transform: uppercase;
        }

        /* ═══════════════════════════ RIGHT ═══════════════════════════ */
        .lp-right {
          position: relative; z-index: 1;
          background: ${d ? '#07070c' : '#f9f8f5'};
          display: flex; align-items: center; justify-content: center;
          padding: 48px clamp(24px, 5vw, 60px);
          overflow: hidden;
          transition: background 0.3s;
        }

        /* Subtle arc */
        .lp-right::before {
          content: '';
          position: absolute;
          bottom: -120px; right: -120px;
          width: 400px; height: 400px; border-radius: 50%;
          border: 1px solid ${d ? 'rgba(212,165,75,0.08)' : 'rgba(180,130,40,0.07)'};
          pointer-events: none;
        }
        .lp-right::after {
          content: '';
          position: absolute;
          bottom: -60px; right: -60px;
          width: 260px; height: 260px; border-radius: 50%;
          border: 1px solid ${d ? 'rgba(212,165,75,0.05)' : 'rgba(180,130,40,0.05)'};
          pointer-events: none;
        }

        /* Theme toggle */
        .lp-toggle {
          position: absolute; top: 20px; right: 20px; z-index: 10;
          width: 36px; height: 36px; border-radius: 50%;
          border: 1px solid ${d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)'};
          background: ${d ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'};
          color: ${d ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.38)'};
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all 0.16s;
        }
        .lp-toggle:hover {
          background: ${d ? 'rgba(212,165,75,0.10)' : 'rgba(180,130,40,0.08)'};
          border-color: ${d ? 'rgba(212,165,75,0.25)' : 'rgba(180,130,40,0.22)'};
          color: ${d ? '#d4a54b' : '#9a6810'};
        }

        /* Card */
        .lp-card {
          position: relative; z-index: 2;
          width: 100%; max-width: 370px;
          opacity: 0; transform: translateY(20px);
          transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .lp-card.lp-ready { opacity: 1; transform: translateY(0); }

        /* Form panel */
        .lp-panel {
          background: ${d ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.88)'};
          border: 1px solid ${d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'};
          border-radius: 4px;
          padding: 38px 34px 34px;
          box-shadow: ${d
            ? '0 0 0 1px rgba(255,255,255,0.02), 0 24px 64px rgba(0,0,0,0.6)'
            : '0 1px 2px rgba(0,0,0,0.04), 0 8px 40px rgba(0,0,0,0.07)'};
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          transition: background 0.3s, border-color 0.3s;
        }

        /* Gold top bar on panel */
        .lp-panel::before {
          content: '';
          position: absolute; top: -1px; left: 32px; right: 32px; height: 2px;
          background: linear-gradient(90deg,
            transparent 0%,
            ${d ? 'rgba(212,165,75,0.55)' : 'rgba(180,130,40,0.45)'} 30%,
            ${d ? 'rgba(212,165,75,0.55)' : 'rgba(180,130,40,0.45)'} 70%,
            transparent 100%);
          border-radius: 0 0 2px 2px;
        }

        .lp-panel { position: relative; }

        .lp-card-h { margin-bottom: 30px; }
        .lp-card-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 28px; font-weight: 400; line-height: 1.1;
          letter-spacing: -0.01em; margin-bottom: 7px;
          color: ${d ? 'rgba(245,240,230,0.90)' : 'rgba(15,12,8,0.88)'};
        }
        .lp-card-sub {
          font-size: 12.5px; font-weight: 300; letter-spacing: 0.01em;
          color: ${d ? 'rgba(245,240,230,0.28)' : 'rgba(15,12,8,0.38)'};
        }

        /* Fields */
        .lp-field { margin-bottom: 14px; }
        .lp-label {
          display: block; font-size: 10px; font-weight: 500;
          letter-spacing: 0.13em; text-transform: uppercase; margin-bottom: 8px;
          color: ${d ? 'rgba(245,240,230,0.35)' : 'rgba(15,12,8,0.40)'};
        }
        .lp-wrap { position: relative; }
        .lp-ico {
          position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
          color: ${d ? 'rgba(245,240,230,0.18)' : 'rgba(15,12,8,0.22)'};
          pointer-events: none; transition: color 0.14s;
        }
        .lp-wrap:focus-within .lp-ico {
          color: ${d ? 'rgba(212,165,75,0.55)' : 'rgba(160,110,20,0.55)'};
        }
        .lp-inp {
          width: 100%;
          background: ${d ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'};
          border: 1px solid ${d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)'};
          border-radius: 4px;
          padding: 12px 13px 12px 40px;
          font-family: 'Space Grotesk', inherit; font-size: 13.5px; font-weight: 400;
          color: ${d ? 'rgba(245,240,230,0.88)' : 'rgba(15,12,8,0.88)'};
          outline: none;
          transition: border-color 0.14s, background 0.14s, box-shadow 0.14s;
        }
        .lp-inp.lp-with-eye { padding-right: 42px; }
        .lp-inp::placeholder { color: ${d ? 'rgba(245,240,230,0.14)' : 'rgba(15,12,8,0.20)'}; }
        .lp-inp:focus {
          border-color: ${d ? 'rgba(212,165,75,0.40)' : 'rgba(160,110,20,0.40)'};
          background: ${d ? 'rgba(212,165,75,0.04)' : 'rgba(160,110,20,0.025)'};
          box-shadow: 0 0 0 3px ${d ? 'rgba(212,165,75,0.08)' : 'rgba(160,110,20,0.07)'};
        }
        .lp-eye {
          position: absolute; right: 11px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; padding: 4px; border-radius: 4px;
          color: ${d ? 'rgba(245,240,230,0.20)' : 'rgba(15,12,8,0.25)'};
          display: flex; align-items: center; transition: color 0.12s;
        }
        .lp-eye:hover { color: ${d ? 'rgba(212,165,75,0.65)' : 'rgba(160,110,20,0.65)'}; }

        /* Error */
        .lp-error {
          background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.16);
          border-radius: 4px; padding: 10px 14px; font-size: 12px; color: #f87171;
          margin-bottom: 14px; display: flex; align-items: center; gap: 8px;
          animation: lp-shake 0.35s ease;
        }
        @keyframes lp-shake {
          0%,100% { transform: translateX(0); }
          25%      { transform: translateX(-5px); }
          75%      { transform: translateX(5px); }
        }

        /* Button */
        .lp-btn {
          width: 100%; margin-top: 18px; padding: 13px 16px;
          background: ${d ? '#d4a54b' : '#b07820'};
          border: none; border-radius: 4px;
          color: ${d ? '#0a0806' : '#ffffff'};
          font-family: 'Space Grotesk', inherit; font-size: 13px; font-weight: 600;
          letter-spacing: 0.04em; text-transform: uppercase;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
          position: relative; overflow: hidden;
          box-shadow: ${d ? '0 4px 20px rgba(212,165,75,0.28)' : '0 4px 20px rgba(140,90,10,0.22)'};
          transition: transform 0.1s, box-shadow 0.12s, opacity 0.12s;
        }
        .lp-btn::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 60%);
          opacity: 0; transition: opacity 0.14s;
        }
        .lp-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: ${d ? '0 8px 30px rgba(212,165,75,0.38)' : '0 8px 28px rgba(140,90,10,0.30)'};
        }
        .lp-btn:hover:not(:disabled)::before { opacity: 1; }
        .lp-btn:active:not(:disabled) { transform: translateY(0); }
        .lp-btn:disabled { opacity: 0.48; cursor: not-allowed; }

        .lp-footer {
          margin-top: 18px; text-align: center; font-size: 10.5px; font-weight: 300;
          letter-spacing: 0.03em;
          color: ${d ? 'rgba(245,240,230,0.16)' : 'rgba(15,12,8,0.26)'};
        }

        @keyframes lp-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div className="lp-root">

        {/* ── Left panel ── */}
        <div className="lp-left">
          <div className="lp-ornament" aria-hidden />

          <div className="lp-brand" aria-label="Carcino Vantage">
            <div className="lp-mark">
              <svg width="18" height="22" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.13307 5.97435C9.21934 5.23291 9.33279 4.80925 9.89802 4.0092C10.9029 2.80263 11.6709 2.67501 12.9912 2.4556L13.0042 2.45344C14.8586 2.34816 15.7395 3.26056 16.1799 4.26653C16.6203 5.27251 16.5553 7.03881 16.4233 7.9863C16.2913 8.93378 15.7627 11.4166 12.7608 13.8614C13.5837 14.1538 13.6573 14.1074 14.65 14.2561C15.6004 13.2384 16.1436 12.4864 17.5128 10.8405C18.882 9.19453 19.661 6.91014 19.8772 5.50646C20.0934 4.10278 20.1438 2.45344 18.9963 1.26031C17.8489 0.0671784 15.5888 -0.131673 14.198 0.067179C12.8072 0.266031 10.3732 1.26031 8.68105 2.6289C6.98888 3.9975 6.20076 5.50646 5.57488 7.5418C4.949 9.57714 5.30938 11.2467 6.08485 13.332C7.40174 16.0707 9.01717 17.9291 10.4196 18.8415C11.822 19.7539 12.8072 20.2451 14.3487 22.842C16.2495 19.8123 16.9991 18.6706 18.4632 16.9465C17.5128 15.7767 16.2842 15.1142 13.8735 14.7825C11.4627 14.4508 10.6865 13.6665 10.2341 13.6478C9.78183 13.6291 9.26057 13.6244 9.09831 13.5776C8.93605 13.5309 8.89093 13.5242 8.76218 13.2384C8.62326 12.7331 8.76218 11.9985 8.76218 11.8932C8.76218 11.7879 8.54197 11.6476 8.54197 11.5072C8.54197 11.3668 8.61607 11.2835 8.77377 11.2031C8.77377 11.2031 8.41448 11.0042 8.41448 10.8405C8.41448 10.6767 8.57673 10.0567 8.54197 9.91637C8.50721 9.776 7.68429 9.60054 7.83497 9.3198C7.98565 9.03906 9.16153 7.60314 9.30692 7.30785C9.45232 7.01256 9.15359 6.6787 9.13307 5.97435Z" fill="${d ? '#d4a54b' : '#b07820'}"/>
                <path d="M8.00883 18.0928C5.32942 19.6789 3.54237 20.5984 1.2981 21.2277L0 24C1.2981 23.9064 5.74874 21.7424 9.23739 19.169L8.00883 18.0928Z" fill="${d ? '#d4a54b' : '#b07820'}"/>
              </svg>
            </div>
            <span className="lp-brand-name">Carcino Vantage</span>
          </div>

          <div className="lp-hero">
            <div className="lp-eyebrow">
              <span className="lp-eyebrow-line" />
              The Carcino Foundation
            </div>
            <h1 className="lp-title">
              Work that<br />
              <em>moves</em> the<br />
              <strong>world forward.</strong>
            </h1>
            <p className="lp-sub">
              A distraction-free, fluid and intuitive workspace for the members of The Carcino Foundation.
            </p>
          </div>

          <div className="lp-stats" aria-label="Platform stats">
            {[['200+','Stories published'],['48','Active writers'],['12','Departments']].map(([n,l]) => (
              <div key={l} className="lp-stat">
                <div className="lp-stat-n">{n}</div>
                <div className="lp-stat-l">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="lp-right">
          <button className="lp-toggle" onClick={() => setDark(v => !v)} aria-label={d ? 'Switch to light mode' : 'Switch to dark mode'}>
            {d ? <Sun size={14} strokeWidth={1.6} /> : <Moon size={14} strokeWidth={1.6} />}
          </button>

          <main className={`lp-card${ready ? ' lp-ready' : ''}`}>
            <div className="lp-panel">
              <div className="lp-card-h">
                <h2 className="lp-card-title">Welcome back</h2>
                <p className="lp-card-sub">Sign in to your Carcino Vantage workspace.</p>
              </div>

              {error && (
                <div className="lp-error" role="alert" aria-live="assertive">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} noValidate>
                <div className="lp-field">
                  <label className="lp-label" htmlFor="lp-email">Email address</label>
                  <div className="lp-wrap">
                    <Mail size={14} className="lp-ico" aria-hidden />
                    <input id="lp-email" type="email" className="lp-inp" placeholder="username@carcino.work"
                      value={email} onChange={e => setEmail(e.target.value)}
                      autoComplete="email" required aria-required="true" aria-invalid={!!error} />
                  </div>
                </div>

                <div className="lp-field">
                  <label className="lp-label" htmlFor="lp-pw">Password</label>
                  <div className="lp-wrap">
                    <Lock size={14} className="lp-ico" aria-hidden />
                    <input id="lp-pw" type={showPw ? 'text' : 'password'} className="lp-inp lp-with-eye"
                      placeholder="••••••••••" value={password} onChange={e => setPassword(e.target.value)}
                      autoComplete="current-password" required aria-required="true" aria-invalid={!!error} />
                    <button type="button" className="lp-eye" onClick={() => setShowPw(v => !v)}
                      aria-label={showPw ? 'Hide password' : 'Show password'} aria-pressed={showPw}>
                      {showPw ? <EyeOff size={14} aria-hidden /> : <Eye size={14} aria-hidden />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="lp-btn" disabled={loading || !email || !password} aria-busy={loading}>
                  {loading
                    ? <><Loader2 size={15} style={{ animation: 'lp-spin 0.75s linear infinite' }} aria-hidden /><span>Signing in…</span></>
                    : <><span>Sign in</span><ArrowRight size={14} aria-hidden /></>}
                </button>
              </form>
            </div>

            <footer className="lp-footer">
              <p>© 2026 The Carcino Foundation · All rights reserved</p>
            </footer>
          </main>
        </div>
      </div>
    </>
  );
}
