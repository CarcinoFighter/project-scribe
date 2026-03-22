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
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lp-root {
          min-height: 100dvh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: 'DM Sans', system-ui, sans-serif;
          background: ${d ? '#0c0b0f' : '#f8f7f5'};
          position: relative;
          overflow: hidden;
        }
        @media (max-width: 700px) {
          .lp-root { grid-template-columns: 1fr; }
          .lp-left { display: none; }
        }

        /* ── Grain ── */
        .lp-root::before {
          content: '';
          position: fixed; inset: 0; z-index: 999; pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.80' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 240px;
          opacity: ${d ? 0.032 : 0.022};
          mix-blend-mode: ${d ? 'screen' : 'multiply'};
        }

        /* ── Left ── */
        .lp-left {
          position: relative; overflow: hidden;
          background: ${d ? '#100f16' : '#eceae4'};
          display: flex; flex-direction: column;
          justify-content: space-between;
          padding: clamp(28px,4vw,52px) clamp(24px,4vw,52px);
          transition: background 0.28s;
        }
        .lp-blob {
          position: absolute; border-radius: 50%; pointer-events: none;
          filter: blur(68px); will-change: auto;
        }
        .lp-blob-1 {
          width: 360px; height: 360px; top: -100px; left: -100px;
          background: radial-gradient(circle, ${d ? 'rgba(143,107,187,0.20)' : 'rgba(143,107,187,0.13)'} 0%, transparent 70%);
          animation: lp-drift 10s ease-in-out infinite;
        }
        .lp-blob-2 {
          width: 240px; height: 240px; bottom: 40px; right: -60px;
          background: radial-gradient(circle, ${d ? 'rgba(80,55,160,0.14)' : 'rgba(160,120,210,0.11)'} 0%, transparent 70%);
          animation: lp-drift 13s ease-in-out infinite reverse;
        }
        .lp-blob-3 {
          width: 160px; height: 160px; top: 46%; left: 40%;
          background: radial-gradient(circle, ${d ? 'rgba(200,155,255,0.07)' : 'rgba(143,107,187,0.08)'} 0%, transparent 70%);
          animation: lp-drift 17s ease-in-out infinite;
          animation-delay: -6s;
        }
        @keyframes lp-drift {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(14px,-20px) scale(1.04); }
          66%      { transform: translate(-10px,12px) scale(0.97); }
        }
        .lp-dots {
          position: absolute; inset: 0; pointer-events: none;
          background-image: radial-gradient(${d ? 'rgba(143,107,187,0.09)' : 'rgba(100,62,160,0.06)'} 1px, transparent 1px);
          background-size: 28px 28px;
          mask-image: radial-gradient(ellipse 84% 84% at 50% 50%, black 10%, transparent 76%);
        }
        .lp-brand {
          position: relative; z-index: 2;
          display: flex; align-items: center; gap: 11px;
        }
        .lp-mark {
          width: 33px; height: 33px; border-radius: 9px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: ${d ? 'linear-gradient(135deg,rgba(143,107,187,0.28),rgba(80,55,160,0.38))' : 'linear-gradient(135deg,rgba(143,107,187,0.18),rgba(80,55,160,0.26))'};
          border: 1px solid ${d ? 'rgba(143,107,187,0.20)' : 'rgba(143,107,187,0.16)'};
          box-shadow: 0 0 18px ${d ? 'rgba(143,107,187,0.16)' : 'rgba(143,107,187,0.10)'};
          transition: all 0.28s;
        }
        .lp-brand-name {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: 17px; letter-spacing: -0.01em;
          color: ${d ? 'rgba(237,233,228,0.88)' : 'rgba(17,16,12,0.85)'};
          transition: color 0.22s;
        }
        .lp-hero { position: relative; z-index: 2; }
        .lp-tag {
          display: inline-flex; align-items: center; gap: 7px; margin-bottom: 22px;
          font-size: 10px; font-weight: 600; letter-spacing: 0.13em; text-transform: uppercase;
          color: ${d ? 'rgba(190,160,230,0.82)' : 'rgba(100,62,160,0.80)'};
          background: ${d ? 'rgba(143,107,187,0.09)' : 'rgba(143,107,187,0.07)'};
          border: 1px solid ${d ? 'rgba(143,107,187,0.18)' : 'rgba(143,107,187,0.16)'};
          border-radius: 99px; padding: 4px 12px 4px 10px; transition: all 0.28s;
        }
        .lp-tag::before {
          content: ''; width: 5px; height: 5px; border-radius: 50%;
          background: ${d ? 'rgba(190,160,230,0.82)' : 'rgba(100,62,160,0.80)'}; display: inline-block;
        }
        .lp-title {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: clamp(30px,3.4vw,48px); line-height: 1.10; letter-spacing: -0.022em;
          color: ${d ? 'rgba(237,233,228,0.92)' : 'rgba(17,16,12,0.90)'}; margin-bottom: 18px; transition: color 0.22s;
        }
        .lp-title em { font-style: italic; color: ${d ? '#c4a8e8' : '#7548b8'}; transition: color 0.22s; }
        .lp-sub {
          font-size: 13.5px; line-height: 1.72; max-width: 312px;
          color: ${d ? 'rgba(237,233,228,0.32)' : 'rgba(17,16,12,0.42)'}; transition: color 0.22s;
        }
        .lp-stats {
          position: relative; z-index: 2; display: flex; gap: 28px; padding-top: 26px;
          border-top: 1px solid ${d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}; transition: border-color 0.28s;
        }
        .lp-stat-n {
          font-family: 'DM Serif Display', serif; font-size: 25px; line-height: 1; margin-bottom: 3px;
          color: ${d ? 'rgba(237,233,228,0.76)' : 'rgba(17,16,12,0.76)'}; transition: color 0.22s;
        }
        .lp-stat-l { font-size: 10.5px; letter-spacing: 0.04em; color: ${d ? 'rgba(237,233,228,0.28)' : 'rgba(17,16,12,0.38)'}; transition: color 0.22s; }

        /* ── Right ── */
        .lp-right {
          position: relative; background: ${d ? '#0a090e' : '#f9f8f6'};
          display: flex; align-items: center; justify-content: center;
          padding: 48px clamp(20px,4vw,48px); overflow: hidden; transition: background 0.28s;
        }
        .lp-right::before {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse 55% 42% at 50% 0%, ${d ? 'rgba(143,107,187,0.07)' : 'rgba(143,107,187,0.05)'} 0%, transparent 65%);
        }
        .lp-divider {
          position: absolute; top: 0; bottom: 0; left: 0; width: 1px;
          background: linear-gradient(to bottom, transparent, ${d ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'} 20%, ${d ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'} 80%, transparent);
          pointer-events: none; transition: background 0.28s;
        }
        .lp-toggle {
          position: absolute; top: 18px; right: 18px; z-index: 10;
          width: 34px; height: 34px; border-radius: 50%;
          border: 1px solid ${d ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)'};
          background: ${d ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'};
          color: ${d ? 'rgba(255,255,255,0.40)' : 'rgba(0,0,0,0.38)'};
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(10px); transition: all 0.14s;
        }
        .lp-toggle:hover {
          background: ${d ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'};
          color: ${d ? 'rgba(255,255,255,0.68)' : 'rgba(0,0,0,0.62)'};
          border-color: ${d ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.14)'};
        }

        /* ── Card ── */
        .lp-card {
          position: relative; z-index: 2; width: 100%; max-width: 358px;
          opacity: 0; transform: translateY(16px);
          transition: opacity 0.44s ease, transform 0.44s cubic-bezier(0.22,1,0.36,1);
        }
        .lp-card.lp-ready { opacity: 1; transform: translateY(0); }
        .lp-glass {
          background: ${d ? 'rgba(18,16,28,0.75)' : 'rgba(255,254,252,0.86)'};
          backdrop-filter: blur(22px) saturate(160%);
          -webkit-backdrop-filter: blur(22px) saturate(160%);
          border: 1px solid ${d ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'};
          border-radius: 18px; padding: 34px 30px;
          box-shadow: ${d ? '0 8px 44px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)' : '0 4px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)'};
          transition: background 0.28s, border-color 0.28s, box-shadow 0.28s;
        }
        .lp-card-h { margin-bottom: 28px; }
        .lp-card-title {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: 25px; line-height: 1.08; letter-spacing: -0.022em; margin-bottom: 6px;
          color: ${d ? 'rgba(237,233,228,0.92)' : 'rgba(17,16,12,0.90)'}; transition: color 0.22s;
        }
        .lp-card-sub { font-size: 13px; color: ${d ? 'rgba(237,233,228,0.32)' : 'rgba(17,16,12,0.40)'}; transition: color 0.22s; }

        /* Fields */
        .lp-field { margin-bottom: 13px; }
        .lp-label {
          display: block; font-size: 10.5px; font-weight: 600;
          letter-spacing: 0.09em; text-transform: uppercase; margin-bottom: 7px;
          color: ${d ? 'rgba(237,233,228,0.42)' : 'rgba(17,16,12,0.44)'}; transition: color 0.22s;
        }
        .lp-wrap { position: relative; }
        .lp-ico {
          position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
          color: ${d ? 'rgba(237,233,228,0.22)' : 'rgba(17,16,12,0.26)'};
          pointer-events: none; transition: color 0.13s;
        }
        .lp-wrap:focus-within .lp-ico { color: ${d ? 'rgba(180,148,220,0.65)' : 'rgba(110,65,165,0.60)'}; }
        .lp-inp {
          width: 100%;
          background: ${d ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'};
          border: 1px solid ${d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
          border-radius: 10px; padding: 11px 12px 11px 38px;
          font-family: 'DM Sans', inherit; font-size: 13.5px;
          color: ${d ? 'rgba(237,233,228,0.88)' : 'rgba(17,16,12,0.88)'};
          outline: none; transition: border-color 0.13s, background 0.13s, box-shadow 0.13s;
        }
        .lp-inp.lp-with-eye { padding-right: 40px; }
        .lp-inp::placeholder { color: ${d ? 'rgba(237,233,228,0.16)' : 'rgba(17,16,12,0.22)'}; }
        .lp-inp:focus {
          border-color: rgba(143,107,187,0.50);
          background: ${d ? 'rgba(143,107,187,0.07)' : 'rgba(143,107,187,0.04)'};
          box-shadow: 0 0 0 3px rgba(143,107,187,0.10);
        }
        .lp-eye {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; padding: 4px; border-radius: 5px;
          color: ${d ? 'rgba(237,233,228,0.22)' : 'rgba(17,16,12,0.28)'}; display: flex; align-items: center; transition: color 0.12s;
        }
        .lp-eye:hover { color: ${d ? 'rgba(237,233,228,0.55)' : 'rgba(17,16,12,0.55)'}; }

        /* Error */
        .lp-error {
          background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.18);
          border-radius: 8px; padding: 9px 13px; font-size: 12px; color: #f87171;
          margin-bottom: 14px; display: flex; align-items: center; gap: 8px;
          animation: lp-shake 0.36s ease;
        }
        @keyframes lp-shake {
          0%,100% { transform: translateX(0); }
          25%      { transform: translateX(-5px); }
          75%      { transform: translateX(5px); }
        }

        /* Button */
        .lp-btn {
          width: 100%; margin-top: 16px; padding: 12px;
          background: linear-gradient(135deg, #9875c1 0%, #7659a0 100%);
          border: none; border-radius: 10px; color: #fff;
          font-family: 'DM Sans', inherit; font-size: 13.5px; font-weight: 600;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
          position: relative; overflow: hidden;
          box-shadow: 0 4px 22px rgba(130,85,180,0.32), 0 1px 4px rgba(130,85,180,0.18);
          transition: transform 0.11s, box-shadow 0.13s, opacity 0.12s;
        }
        .lp-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(130,85,180,0.42), 0 2px 6px rgba(130,85,180,0.22);
        }
        .lp-btn:hover:not(:disabled)::before { opacity: 1; }
        .lp-btn::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.13) 0%, transparent 100%);
          opacity: 0; transition: opacity 0.14s;
        }
        .lp-btn:active:not(:disabled) { transform: translateY(0); }
        .lp-btn:disabled { opacity: 0.56; cursor: not-allowed; }

        .lp-footer {
          margin-top: 20px; text-align: center; font-size: 10.5px;
          color: ${d ? 'rgba(237,233,228,0.18)' : 'rgba(17,16,12,0.30)'}; transition: color 0.22s;
        }

        @keyframes lp-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div className="lp-root">

        {/* ── Left panel ── */}
        <div className="lp-left">
          <div className="lp-blob lp-blob-1" />
          <div className="lp-blob lp-blob-2" />
          <div className="lp-blob lp-blob-3" />
          <div className="lp-dots" />

          <div className="lp-brand" aria-label="Carcino Scribe">
           <svg width="20" height="24" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9.13307 5.97435C9.21934 5.23291 9.33279 4.80925 9.89802 4.0092C10.9029 2.80263 11.6709 2.67501 12.9912 2.4556L13.0042 2.45344C14.8586 2.34816 15.7395 3.26056 16.1799 4.26653C16.6203 5.27251 16.5553 7.03881 16.4233 7.9863C16.2913 8.93378 15.7627 11.4166 12.7608 13.8614C13.5837 14.1538 13.6573 14.1074 14.65 14.2561C15.6004 13.2384 16.1436 12.4864 17.5128 10.8405C18.882 9.19453 19.661 6.91014 19.8772 5.50646C20.0934 4.10278 20.1438 2.45344 18.9963 1.26031C17.8489 0.0671784 15.5888 -0.131673 14.198 0.067179C12.8072 0.266031 10.3732 1.26031 8.68105 2.6289C6.98888 3.9975 6.20076 5.50646 5.57488 7.5418C4.949 9.57714 5.30938 11.2467 6.08485 13.332C7.40174 16.0707 9.01717 17.9291 10.4196 18.8415C11.822 19.7539 12.8072 20.2451 14.3487 22.842C16.2495 19.8123 16.9991 18.6706 18.4632 16.9465C17.5128 15.7767 16.2842 15.1142 13.8735 14.7825C11.4627 14.4508 10.6865 13.6665 10.2341 13.6478C9.78183 13.6291 9.26057 13.6244 9.09831 13.5776C8.93605 13.5309 8.89093 13.5242 8.76218 13.2384C8.62326 12.7331 8.76218 11.9985 8.76218 11.8932C8.76218 11.7879 8.54197 11.6476 8.54197 11.5072C8.54197 11.3668 8.61607 11.2835 8.77377 11.2031C8.77377 11.2031 8.41448 11.0042 8.41448 10.8405C8.41448 10.6767 8.57673 10.0567 8.54197 9.91637C8.50721 9.776 7.68429 9.60054 7.83497 9.3198C7.98565 9.03906 9.16153 7.60314 9.30692 7.30785C9.45232 7.01256 9.15359 6.6787 9.13307 5.97435Z" fill="#9875c1"/>
<path d="M8.00883 18.0928C5.32942 19.6789 3.54237 20.5984 1.2981 21.2277L0 24C1.2981 23.9064 5.74874 21.7424 9.23739 19.169L8.00883 18.0928Z" fill="#9875c1"/>
</svg>
            <span className="lp-brand-name">Carcino Scribe</span>
          </div>

          <div className="lp-hero">
            <div className="lp-tag">The Carcino Foundation</div>
            <h1 className="lp-title">Make an impact<br />that <em>matters.</em></h1>
            <p className="lp-sub">A distraction-free, fluid and intuitive workspace for the members of The Carcino Foundation.</p>
          </div>

          <div className="lp-stats" aria-label="Platform stats">
            {[['200+','Stories published'],['48','Active writers'],['12','Departments']].map(([n,l]) => (
              <div key={l}>
                <div className="lp-stat-n">{n}</div>
                <div className="lp-stat-l">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="lp-right">
          <div className="lp-divider" aria-hidden />

          <button className="lp-toggle" onClick={() => setDark(v => !v)} aria-label={d ? 'Switch to light mode' : 'Switch to dark mode'}>
            {d ? <Sun size={14} strokeWidth={1.8} /> : <Moon size={14} strokeWidth={1.8} />}
          </button>

          <main className={`lp-card${ready ? ' lp-ready' : ''}`}>
            <div className="lp-glass">
              <div className="lp-card-h">
                <h2 className="lp-card-title">Sign in</h2>
                <p className="lp-card-sub">Welcome back — let's change the world.</p>
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
                    <input id="lp-email" type="email" className="lp-inp" placeholder="name@organisation.com"
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
