'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff, Sun, Moon,
         PenTool, Palette, Code2, Megaphone, Users } from 'lucide-react';

/* ─── Department data ───────────────────────────────────────────── */
const DEPTS = [
  { name: "Writers' Block", Icon: PenTool,   color: '#f59e0b', glow: 'rgba(245,158,11,0.40)',  angle: -68 },
  { name: 'Design Lab',     Icon: Palette,   color: '#3b82f6', glow: 'rgba(59,130,246,0.40)',  angle:   4 },
  { name: 'Development',    Icon: Code2,     color: '#10b981', glow: 'rgba(16,185,129,0.40)',  angle:  76 },
  { name: 'Public Relations',Icon: Megaphone,color: '#ec4899', glow: 'rgba(236,72,153,0.40)', angle: 148 },
  { name: 'Leadership',     Icon: Users,     color: '#8b5cf6', glow: 'rgba(139,92,246,0.40)', angle: 220 },
];

function nodePos(angleDeg: number, r = 174) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: 250 + r * Math.cos(rad), y: 250 + r * Math.sin(rad) };
}

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [ready,    setReady]    = useState(false);
  const [dark,     setDark]     = useState(true);
  const [tick,     setTick]     = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const isDark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
    setReady(true);
    const id = setInterval(() => setTick(t => (t + 1) % DEPTS.length), 1400);
    return () => clearInterval(id);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
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
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Root layout ─────────────────────────────────────────── */
        .lp-root {
          min-height: 100dvh;
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          font-family: 'Google Sans Flex','Google Sans','DM Sans',system-ui,sans-serif;
          -webkit-font-smoothing: antialiased;
          background: ${dark ? '#06060c' : '#f5f4f2'};
          position: relative; overflow: hidden;
        }
        @media (max-width: 860px) {
          .lp-root { grid-template-columns: 1fr; }
          .lp-left { display: none !important; }
        }

        /* Grain */
        .lp-root::before {
          content: ''; position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image: var(--noise); background-size: 240px;
          opacity: ${dark ? 0.032 : 0.022};
          mix-blend-mode: ${dark ? 'screen' : 'multiply'};
        }

        /* ════ LEFT PANEL ══════════════════════════════════════════ */
        .lp-left {
          position: relative; z-index: 1; overflow: hidden;
          background: ${dark ? '#09080f' : '#eceaf0'};
          border-right: 1px solid ${dark ? 'rgba(143,107,187,0.12)' : 'rgba(143,107,187,0.16)'};
          display: flex; flex-direction: column; justify-content: space-between;
          padding: 36px 44px;
        }

        /* Corner reticles */
        .lp-reticle {
          position: absolute; width: 20px; height: 20px; z-index: 0; pointer-events: none;
          border-color: ${dark ? 'rgba(143,107,187,0.24)' : 'rgba(143,107,187,0.30)'};
          border-style: solid;
        }
        .lp-tl { top:18px; left:18px; border-width:1px 0 0 1px; }
        .lp-tr { top:18px; right:18px; border-width:1px 1px 0 0; }
        .lp-bl { bottom:18px; left:18px; border-width:0 0 1px 1px; }
        .lp-br { bottom:18px; right:18px; border-width:0 1px 1px 0; }

        /* Horizontal scan line */
        .lp-scan {
          position: absolute; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(143,107,187,0.7) 30%,
            rgba(180,148,220,0.9) 50%, rgba(143,107,187,0.7) 70%, transparent 100%);
          box-shadow: 0 0 16px rgba(143,107,187,0.5);
          animation: lp-scan-anim 9s ease-in-out infinite;
          pointer-events: none; z-index: 0;
        }
        @keyframes lp-scan-anim {
          0%    { top: 18%; opacity: 0; }
          6%    { opacity: 1; }
          46%   { top: 80%; opacity: 1; }
          54%   { opacity: 0; top: 80%; }
          100%  { top: 80%; opacity: 0; }
        }

        /* Brand */
        .lp-brand {
          position: relative; z-index: 2;
          display: flex; align-items: center; gap: 10px;
        }
        .lp-brand-name {
          font-size: 12.5px; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase;
          color: ${dark ? 'rgba(237,233,228,0.45)' : 'rgba(15,12,8,0.45)'};
        }

        /* Orbital container */
        .lp-orbital {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -52%);
          width: min(500px, 86%);
          z-index: 1; pointer-events: none;
        }
        .lp-orbital svg { width: 100%; height: 100%; overflow: visible; }

        /* Ring CSS animations */
        @keyframes spin-cw  { to { transform: rotate(360deg);  } }
        @keyframes spin-ccw { to { transform: rotate(-360deg); } }
        .r1 { transform-origin:250px 250px; animation: spin-cw  90s linear infinite; }
        .r2 { transform-origin:250px 250px; animation: spin-ccw 58s linear infinite; }
        .r3 { transform-origin:250px 250px; animation: spin-cw  38s linear infinite; }
        .r4 { transform-origin:250px 250px; animation: spin-ccw 25s linear infinite; }

        /* Node ping */
        @keyframes node-ping {
          0%   { r: 7;  opacity: 0.8; }
          100% { r: 30; opacity: 0;   }
        }

        /* Hero text */
        .lp-hero { position: relative; z-index: 2; }
        .lp-eyebrow {
          display: flex; align-items: center; gap: 10px; margin-bottom: 14px;
          font-size: 10px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;
          color: ${dark ? 'rgba(143,107,187,0.72)' : 'rgba(100,60,160,0.72)'};
        }
        .lp-eyebrow::before {
          content: ''; display: inline-block; width: 22px; height: 1px; flex-shrink: 0;
          background: ${dark ? 'rgba(143,107,187,0.55)' : 'rgba(100,60,160,0.50)'};
        }
        .lp-headline {
          font-size: clamp(26px, 3.2vw, 42px); font-weight: 700;
          letter-spacing: -0.03em; line-height: 1.09;
          color: ${dark ? 'rgba(237,233,228,0.93)' : 'rgba(15,12,8,0.90)'};
          margin-bottom: 14px;
        }
        .lp-headline em {
          font-style: italic; font-weight: 400;
          color: ${dark ? 'rgba(180,148,220,0.88)' : 'rgba(100,60,160,0.80)'};
        }
        .lp-sub {
          font-size: 13px; line-height: 1.72; font-weight: 400;
          color: ${dark ? 'rgba(237,233,228,0.30)' : 'rgba(15,12,8,0.38)'};
          max-width: 310px; margin-bottom: 22px;
        }

        /* Dept chips */
        .lp-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .lp-chip {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px 4px 7px; border-radius: 99px;
          font-size: 10px; font-weight: 600; border: 1px solid; letter-spacing: 0.01em;
          transition: opacity 0.3s, box-shadow 0.3s;
        }
        .lp-chip-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        /* ════ RIGHT PANEL ═════════════════════════════════════════ */
        .lp-right {
          position: relative; z-index: 1; overflow: hidden;
          background: ${dark ? '#06060c' : '#f9f8f6'};
          display: flex; align-items: center; justify-content: center;
          padding: 48px clamp(24px, 5vw, 56px);
        }
        .lp-right::before {
          content: ''; position: absolute; top: -80px; right: -80px;
          width: 300px; height: 300px; border-radius: 50%; pointer-events: none;
          background: radial-gradient(circle,
            ${dark ? 'rgba(143,107,187,0.08)' : 'rgba(143,107,187,0.06)'} 0%, transparent 70%);
        }

        /* Theme toggle */
        .lp-toggle {
          position: absolute; top: 20px; right: 20px; z-index: 10;
          width: 34px; height: 34px; border-radius: 8px;
          border: 1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)'};
          background: ${dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'};
          color: ${dark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.32)'};
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all 0.14s;
        }
        .lp-toggle:hover {
          background: rgba(143,107,187,0.12); border-color: rgba(143,107,187,0.28);
          color: #8f6bbb;
        }

        /* Card */
        .lp-card {
          width: 100%; max-width: 380px;
          opacity: 0; transform: translateY(20px);
          transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1);
          position: relative; z-index: 2;
        }
        .lp-card.rdy { opacity: 1; transform: translateY(0); }

        .lp-panel {
          background: ${dark ? 'rgba(14,12,24,0.88)' : 'rgba(255,255,255,0.92)'};
          border: 1px solid ${dark ? 'rgba(143,107,187,0.16)' : 'rgba(143,107,187,0.20)'};
          border-radius: 16px; padding: 34px 30px 28px;
          backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px);
          box-shadow: ${dark
            ? '0 0 0 1px rgba(143,107,187,0.06) inset, 0 24px 64px rgba(0,0,0,0.70)'
            : '0 8px 40px rgba(0,0,0,0.09), 0 1px 3px rgba(0,0,0,0.04)'};
          position: relative; overflow: hidden;
        }

        /* Animated shimmer rim */
        .lp-panel::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg,
            transparent 0%, rgba(143,107,187,0.55) 35%,
            rgba(200,168,235,0.85) 50%, rgba(143,107,187,0.55) 65%, transparent 100%);
          background-size: 200% 100%;
          animation: lp-shim 3.5s ease-in-out infinite;
        }
        @keyframes lp-shim {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Soft inner glow */
        .lp-panel::after {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse 80% 38% at 50% 0%,
            ${dark ? 'rgba(143,107,187,0.06)' : 'rgba(143,107,187,0.04)'} 0%, transparent 70%);
        }

        .lp-card-hd { margin-bottom: 24px; position: relative; z-index: 1; }
        .lp-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 9px; border-radius: 99px; margin-bottom: 10px;
          font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
          background: rgba(143,107,187,0.10); border: 1px solid rgba(143,107,187,0.22);
          color: ${dark ? 'rgba(180,148,220,0.80)' : 'rgba(100,60,160,0.78)'};
        }
        .lp-badge-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: ${dark ? 'rgba(180,148,220,0.80)' : 'rgba(100,60,160,0.78)'};
          animation: lp-blink 2s ease-in-out infinite;
        }
        @keyframes lp-blink {
          0%,100% { opacity: 1; } 50% { opacity: 0.3; }
        }
        .lp-card-title {
          font-size: 22px; font-weight: 700; letter-spacing: -0.022em;
          color: ${dark ? 'rgba(237,233,228,0.92)' : 'rgba(15,12,8,0.90)'};
          margin-bottom: 5px;
        }
        .lp-card-sub {
          font-size: 12.5px; color: ${dark ? 'rgba(237,233,228,0.28)' : 'rgba(15,12,8,0.36)'};
        }

        /* Fields */
        .lp-field { margin-bottom: 11px; position: relative; z-index: 1; }
        .lp-lbl {
          display: block; font-size: 10px; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 7px;
          color: ${dark ? 'rgba(237,233,228,0.35)' : 'rgba(15,12,8,0.38)'};
        }
        .lp-fw { position: relative; }
        .lp-ico {
          position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
          color: ${dark ? 'rgba(237,233,228,0.20)' : 'rgba(15,12,8,0.22)'};
          pointer-events: none; transition: color 0.13s;
        }
        .lp-fw:focus-within .lp-ico { color: rgba(143,107,187,0.65); }
        .lp-inp {
          width: 100%;
          background: ${dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'};
          border: 1px solid ${dark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)'};
          border-radius: 10px; padding: 11px 12px 11px 38px;
          font-family: inherit; font-size: 13.5px;
          color: ${dark ? 'rgba(237,233,228,0.88)' : 'rgba(15,12,8,0.88)'};
          outline: none;
          transition: border-color 0.13s, background 0.13s, box-shadow 0.13s;
        }
        .lp-inp.ey { padding-right: 40px; }
        .lp-inp::placeholder { color: ${dark ? 'rgba(237,233,228,0.16)' : 'rgba(15,12,8,0.20)'}; }
        .lp-inp:focus {
          border-color: rgba(143,107,187,0.55);
          background: ${dark ? 'rgba(143,107,187,0.05)' : 'rgba(143,107,187,0.02)'};
          box-shadow: 0 0 0 3px rgba(143,107,187,0.10);
        }
        .lp-eye {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; padding: 4px; border-radius: 4px;
          color: ${dark ? 'rgba(237,233,228,0.22)' : 'rgba(15,12,8,0.28)'};
          display: flex; align-items: center; transition: color 0.12s;
        }
        .lp-eye:hover { color: rgba(143,107,187,0.70); }

        /* Error */
        .lp-err {
          background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.18);
          border-radius: 8px; padding: 9px 13px; font-size: 12px; color: #f87171;
          margin-bottom: 12px; display: flex; align-items: center; gap: 8px;
          position: relative; z-index: 1; animation: lp-shake 0.34s ease;
        }
        @keyframes lp-shake {
          0%,100% { transform: translateX(0); }
          25%      { transform: translateX(-5px); }
          75%      { transform: translateX(5px); }
        }

        /* CTA */
        .lp-btn {
          width: 100%; margin-top: 18px; padding: 12px 16px;
          background: linear-gradient(135deg, #9875c1 0%, #7659a0 100%);
          border: none; border-radius: 10px; color: #fff;
          font-family: inherit; font-size: 13.5px; font-weight: 700; letter-spacing: -0.01em;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px;
          position: relative; z-index: 1; overflow: hidden;
          box-shadow: 0 4px 20px rgba(130,85,180,0.38), 0 1px 4px rgba(130,85,180,0.20);
          transition: transform 0.10s, box-shadow 0.12s, opacity 0.12s;
        }
        .lp-btn::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.16) 0%, transparent 60%);
          opacity: 0; transition: opacity 0.14s;
        }
        .lp-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(130,85,180,0.48), 0 2px 8px rgba(130,85,180,0.22);
        }
        .lp-btn:hover:not(:disabled)::before { opacity: 1; }
        .lp-btn:active:not(:disabled) { transform: translateY(0); }
        .lp-btn:disabled { opacity: 0.48; cursor: not-allowed; }

        /* Active dept ticker */
        .lp-ticker {
          position: relative; z-index: 1;
          margin-top: 18px; padding-top: 16px;
          border-top: 1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'};
          display: flex; align-items: center; gap: 8px;
          font-size: 11px; color: ${dark ? 'rgba(237,233,228,0.28)' : 'rgba(15,12,8,0.35)'};
          overflow: hidden;
        }
        .lp-ticker-dot {
          width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
          transition: background 0.4s ease, box-shadow 0.4s ease;
        }
        .lp-ticker-name {
          font-weight: 600; transition: color 0.4s ease;
        }

        .lp-foot {
          margin-top: 14px; text-align: center; font-size: 10.5px;
          color: ${dark ? 'rgba(237,233,228,0.14)' : 'rgba(15,12,8,0.24)'};
        }

        @keyframes lp-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div className="lp-root">

        {/* ════ LEFT ══════════════════════════════════════════════ */}
        <div className="lp-left">
          <div className="lp-reticle lp-tl" aria-hidden />
          <div className="lp-reticle lp-tr" aria-hidden />
          <div className="lp-reticle lp-bl" aria-hidden />
          <div className="lp-reticle lp-br" aria-hidden />
          <div className="lp-scan" aria-hidden />

          {/* Brand */}
          <div className="lp-brand">
            <svg width="16" height="20" viewBox="0 0 20 24" fill="none" aria-hidden>
              <path d="M9.13307 5.97435C9.21934 5.23291 9.33279 4.80925 9.89802 4.0092C10.9029 2.80263 11.6709 2.67501 12.9912 2.4556L13.0042 2.45344C14.8586 2.34816 15.7395 3.26056 16.1799 4.26653C16.6203 5.27251 16.5553 7.03881 16.4233 7.9863C16.2913 8.93378 15.7627 11.4166 12.7608 13.8614C13.5837 14.1538 13.6573 14.1074 14.65 14.2561C15.6004 13.2384 16.1436 12.4864 17.5128 10.8405C18.882 9.19453 19.661 6.91014 19.8772 5.50646C20.0934 4.10278 20.1438 2.45344 18.9963 1.26031C17.8489 0.0671784 15.5888 -0.131673 14.198 0.067179C12.8072 0.266031 10.3732 1.26031 8.68105 2.6289C6.98888 3.9975 6.20076 5.50646 5.57488 7.5418C4.949 9.57714 5.30938 11.2467 6.08485 13.332C7.40174 16.0707 9.01717 17.9291 10.4196 18.8415C11.822 19.7539 12.8072 20.2451 14.3487 22.842C16.2495 19.8123 16.9991 18.6706 18.4632 16.9465C17.5128 15.7767 16.2842 15.1142 13.8735 14.7825C11.4627 14.4508 10.6865 13.6665 10.2341 13.6478C9.78183 13.6291 9.26057 13.6244 9.09831 13.5776C8.93605 13.5309 8.89093 13.5242 8.76218 13.2384C8.62326 12.7331 8.76218 11.9985 8.76218 11.8932C8.76218 11.7879 8.54197 11.6476 8.54197 11.5072C8.54197 11.3668 8.61607 11.2835 8.77377 11.2031C8.77377 11.2031 8.41448 11.0042 8.41448 10.8405C8.41448 10.6767 8.57673 10.0567 8.54197 9.91637C8.50721 9.776 7.68429 9.60054 7.83497 9.3198C7.98565 9.03906 9.16153 7.60314 9.30692 7.30785C9.45232 7.01256 9.15359 6.6787 9.13307 5.97435Z" fill={dark ? '#9875c1' : '#7659a0'}/>
              <path d="M8.00883 18.0928C5.32942 19.6789 3.54237 20.5984 1.2981 21.2277L0 24C1.2981 23.9064 5.74874 21.7424 9.23739 19.169L8.00883 18.0928Z" fill={dark ? '#9875c1' : '#7659a0'}/>
            </svg>
            <span className="lp-brand-name">Carcino Vantage</span>
          </div>

          {/* ── Orbital ─────────────────────────────────────────── */}
          <div className="lp-orbital" aria-hidden>
            <svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%"   stopColor="#9875c1" stopOpacity="0.9" />
                  <stop offset="45%"  stopColor="#7659a0" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#7659a0" stopOpacity="0"   />
                </radialGradient>
                <radialGradient id="core-fill" cx="38%" cy="38%" r="60%">
                  <stop offset="0%"   stopColor="#d4b8f0" />
                  <stop offset="60%"  stopColor="#9875c1" />
                  <stop offset="100%" stopColor="#6040a0" />
                </radialGradient>
                {DEPTS.map((d, i) => (
                  <radialGradient key={i} id={`dg${i}`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%"   stopColor={d.color} stopOpacity="0.55" />
                    <stop offset="100%" stopColor={d.color} stopOpacity="0"    />
                  </radialGradient>
                ))}
                <filter id="f-blur-md"><feGaussianBlur stdDeviation="6" /></filter>
                <filter id="f-blur-lg"><feGaussianBlur stdDeviation="18" /></filter>
                <filter id="f-glow">
                  <feGaussianBlur stdDeviation="2.5" result="b"/>
                  <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>

              {/* Ambient core bloom */}
              <circle cx="250" cy="250" r="220" fill="url(#core-glow)"
                filter="url(#f-blur-lg)" opacity={dark ? 0.28 : 0.18} />

              {/* Ring 1 — outermost, very slow */}
              <g className="r1">
                <circle cx="250" cy="250" r="228" fill="none"
                  stroke={dark ? 'rgba(143,107,187,0.13)' : 'rgba(143,107,187,0.18)'}
                  strokeWidth="1" strokeDasharray="3 15" />
              </g>

              {/* Ring 2 — department orbit */}
              <g className="r2">
                <circle cx="250" cy="250" r="174" fill="none"
                  stroke={dark ? 'rgba(143,107,187,0.30)' : 'rgba(143,107,187,0.38)'}
                  strokeWidth="1.2" strokeDasharray="6 16" />
              </g>

              {/* Ring 3 */}
              <g className="r3">
                <circle cx="250" cy="250" r="120" fill="none"
                  stroke={dark ? 'rgba(143,107,187,0.22)' : 'rgba(143,107,187,0.28)'}
                  strokeWidth="1" strokeDasharray="4 10" />
              </g>

              {/* Ring 4 — innermost */}
              <g className="r4">
                <circle cx="250" cy="250" r="70" fill="none"
                  stroke={dark ? 'rgba(143,107,187,0.38)' : 'rgba(143,107,187,0.42)'}
                  strokeWidth="1" strokeDasharray="2 8" />
              </g>

              {/* ── Department nodes (static — rings pass around them) ── */}
              {DEPTS.map((dept, i) => {
                const { x, y } = nodePos(dept.angle);
                const active = tick === i;
                const dx = x - 250, dy = y - 250;
                const len = Math.sqrt(dx * dx + dy * dy);
                const nx = dx / len, ny = dy / len;
                const lx = x + nx * 30, ly = y + ny * 28;
                const anchor = nx > 0.35 ? 'start' : nx < -0.35 ? 'end' : 'middle';

                return (
                  <g key={i} filter="url(#f-glow)">
                    {/* Dept glow disc */}
                    <circle cx={x} cy={y} r="30"
                      fill={`url(#dg${i})`} filter="url(#f-blur-md)"
                      opacity={active ? 1 : 0.45}
                      style={{ transition: 'opacity 0.4s' }} />

                    {/* Ping ring (active) */}
                    {active && (
                      <circle cx={x} cy={y} r="7" fill="none"
                        stroke={dept.color} strokeWidth="1.2"
                        style={{ animation: 'node-ping 1.3s ease-out forwards' }} />
                    )}

                    {/* Node dot */}
                    <circle cx={x} cy={y}
                      r={active ? 7 : 5}
                      fill={dept.color}
                      style={{
                        transition: 'r 0.35s cubic-bezier(0.34,1.6,0.64,1)',
                        filter: `drop-shadow(0 0 ${active ? 9 : 4}px ${dept.color})`,
                      }} />

                    {/* Connector */}
                    <line
                      x1={x + nx * 9} y1={y + ny * 9}
                      x2={lx - nx * 8} y2={ly - ny * 8}
                      stroke={dept.color} strokeWidth="0.7"
                      opacity={active ? 0.75 : 0.30}
                      style={{ transition: 'opacity 0.4s' }} />

                    {/* Label bg */}
                    <rect
                      x={anchor === 'start' ? lx : anchor === 'end' ? lx - 96 : lx - 48}
                      y={ly - 10} width="96" height="18" rx="5"
                      fill={dark ? 'rgba(9,8,15,0.80)' : 'rgba(245,244,242,0.88)'}
                      stroke={dept.color} strokeWidth="0.5"
                      opacity={active ? 1 : 0.50}
                      style={{ transition: 'opacity 0.4s' }} />

                    {/* Label text */}
                    <text x={lx} y={ly + 1}
                      textAnchor={anchor} dominantBaseline="middle"
                      fontSize="8.5" fontWeight="600"
                      fontFamily="'Google Sans Flex','DM Sans',system-ui"
                      fill={active ? dept.color : (dark ? 'rgba(237,233,228,0.55)' : 'rgba(15,12,8,0.52)')}
                      style={{ transition: 'fill 0.4s' }}>
                      {dept.name}
                    </text>
                  </g>
                );
              })}

              {/* ── Core ── */}
              <circle cx="250" cy="250" r="46"
                fill="url(#core-glow)" filter="url(#f-blur-md)" opacity="0.85" />
              <circle cx="250" cy="250" r="22" fill="url(#core-fill)"
                style={{ filter: 'drop-shadow(0 0 12px rgba(152,117,193,0.85))' }} />
              {/* Logo inside core */}
              <g transform="translate(239.5, 238.5) scale(0.5)" opacity="0.92">
                <path d="M9.13307 5.97435C9.21934 5.23291 9.33279 4.80925 9.89802 4.0092C10.9029 2.80263 11.6709 2.67501 12.9912 2.4556L13.0042 2.45344C14.8586 2.34816 15.7395 3.26056 16.1799 4.26653C16.6203 5.27251 16.5553 7.03881 16.4233 7.9863C16.2913 8.93378 15.7627 11.4166 12.7608 13.8614C13.5837 14.1538 13.6573 14.1074 14.65 14.2561C15.6004 13.2384 16.1436 12.4864 17.5128 10.8405C18.882 9.19453 19.661 6.91014 19.8772 5.50646C20.0934 4.10278 20.1438 2.45344 18.9963 1.26031C17.8489 0.0671784 15.5888 -0.131673 14.198 0.067179C12.8072 0.266031 10.3732 1.26031 8.68105 2.6289C6.98888 3.9975 6.20076 5.50646 5.57488 7.5418C4.949 9.57714 5.30938 11.2467 6.08485 13.332C7.40174 16.0707 9.01717 17.9291 10.4196 18.8415C11.822 19.7539 12.8072 20.2451 14.3487 22.842C16.2495 19.8123 16.9991 18.6706 18.4632 16.9465C17.5128 15.7767 16.2842 15.1142 13.8735 14.7825C11.4627 14.4508 10.6865 13.6665 10.2341 13.6478C9.78183 13.6291 9.26057 13.6244 9.09831 13.5776C8.93605 13.5309 8.89093 13.5242 8.76218 13.2384C8.62326 12.7331 8.76218 11.9985 8.76218 11.8932C8.76218 11.7879 8.54197 11.6476 8.54197 11.5072C8.54197 11.3668 8.61607 11.2835 8.77377 11.2031C8.77377 11.2031 8.41448 11.0042 8.41448 10.8405C8.41448 10.6767 8.57673 10.0567 8.54197 9.91637C8.50721 9.776 7.68429 9.60054 7.83497 9.3198C7.98565 9.03906 9.16153 7.60314 9.30692 7.30785C9.45232 7.01256 9.15359 6.6787 9.13307 5.97435Z" fill="white"/>
                <path d="M8.00883 18.0928C5.32942 19.6789 3.54237 20.5984 1.2981 21.2277L0 24C1.2981 23.9064 5.74874 21.7424 9.23739 19.169L8.00883 18.0928Z" fill="white"/>
              </g>
            </svg>
          </div>

          {/* ── Hero text ── */}
          <div className="lp-hero">
            <div className="lp-eyebrow">The Carcino Foundation</div>
            <h1 className="lp-headline">
              One workspace.<br />
              <em>Every department.</em>
            </h1>
            <p className="lp-sub">
              Writers, designers, developers, PR, and leadership — unified in one platform, built for work that matters.
            </p>
            <div className="lp-chips">
              {DEPTS.map((dept, i) => (
                <span key={dept.name} className="lp-chip"
                  style={{
                    background: dark ? `${dept.color}12` : `${dept.color}0e`,
                    borderColor: dark ? `${dept.color}28` : `${dept.color}22`,
                    color: dept.color,
                    opacity: tick === i ? 1 : 0.52,
                    boxShadow: tick === i ? `0 0 10px ${dept.glow}` : 'none',
                  }}>
                  <span className="lp-chip-dot" style={{ background: dept.color }} />
                  {dept.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ════ RIGHT ═════════════════════════════════════════════ */}
        <div className="lp-right">
          <button className="lp-toggle" onClick={toggleDark}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
            {dark ? <Sun size={14} strokeWidth={1.8} /> : <Moon size={14} strokeWidth={1.8} />}
          </button>

          <div className={`lp-card${ready ? ' rdy' : ''}`}>
            <div className="lp-panel">
              <div className="lp-card-hd">
                <div className="lp-badge">
                  <span className="lp-badge-dot" />
                  Workspace Access
                </div>
                <h2 className="lp-card-title">Sign in to Vantage</h2>
                <p className="lp-card-sub">Welcome back — your team is waiting.</p>
              </div>

              {error && (
                <div className="lp-err" role="alert" aria-live="assertive">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} noValidate>
                <div className="lp-field">
                  <label className="lp-lbl" htmlFor="lp-email">Email address</label>
                  <div className="lp-fw">
                    <Mail size={14} className="lp-ico" aria-hidden />
                    <input id="lp-email" type="email" className="lp-inp"
                      placeholder="you@carcino.work"
                      value={email} onChange={e => setEmail(e.target.value)}
                      autoComplete="email" required aria-required="true" aria-invalid={!!error} />
                  </div>
                </div>
                <div className="lp-field">
                  <label className="lp-lbl" htmlFor="lp-pw">Password</label>
                  <div className="lp-fw">
                    <Lock size={14} className="lp-ico" aria-hidden />
                    <input id="lp-pw" type={showPw ? 'text' : 'password'} className="lp-inp ey"
                      placeholder="••••••••••"
                      value={password} onChange={e => setPassword(e.target.value)}
                      autoComplete="current-password" required aria-required="true" aria-invalid={!!error} />
                    <button type="button" className="lp-eye"
                      onClick={() => setShowPw(v => !v)}
                      aria-label={showPw ? 'Hide password' : 'Show password'} aria-pressed={showPw}>
                      {showPw ? <EyeOff size={14} aria-hidden /> : <Eye size={14} aria-hidden />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="lp-btn"
                  disabled={loading || !email || !password} aria-busy={loading}>
                  {loading
                    ? <><Loader2 size={15} style={{ animation: 'lp-spin 0.75s linear infinite' }} aria-hidden /><span>Signing in…</span></>
                    : <><span>Sign in</span><ArrowRight size={14} aria-hidden /></>}
                </button>
              </form>

              {/* Live dept ticker */}
              <div className="lp-ticker">
                <span className="lp-ticker-dot"
                  style={{ background: activeDept.color, boxShadow: `0 0 8px ${activeDept.glow}` }} />
                <span>
                  <span className="lp-ticker-name" style={{ color: activeDept.color }}>
                    {activeDept.name}
                  </span>
                  {' '}is active on Vantage
                </span>
              </div>
            </div>

            <footer className="lp-foot">© 2026 The Carcino Foundation · All rights reserved</footer>
          </div>
        </div>

      </div>
    </>
  );
}