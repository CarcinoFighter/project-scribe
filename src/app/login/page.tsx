'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PenTool, Lock, Mail, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // On success, redirect to dashboard
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-bg min-h-screen flex items-center justify-center p-6">
      <div className="glass-raised w-full max-w-md p-8 rounded-[var(--r-xl)] anim-fade-up">
        {/* Logo/Icon */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-[var(--accent-subtle2)] rounded-[var(--r-lg)] flex items-center justify-center mb-4">
            <PenTool size={28} className="text-[var(--accent)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">Carcino Scribe</h1>
          <p className="text-[var(--text-4)] text-sm mt-1">Sign in to your writing dashboard</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-[var(--r-sm)] text-red-500 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[var(--text-3)] text-xs font-semibold uppercase tracking-wider mb-2 ml-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-4)]">
                <Mail size={16} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[var(--bg-deep)] border border-[var(--border-med)] rounded-[var(--r-md)] py-2.5 pl-10 pr-4 text-[var(--text)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[var(--text-3)] text-xs font-semibold uppercase tracking-wider mb-2 ml-1 text-right">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-4)]">
                <Lock size={16} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[var(--bg-deep)] border border-[var(--border-med)] rounded-[var(--r-md)] py-2.5 pl-10 pr-4 text-[var(--text)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-2.5 rounded-[var(--r-md)] font-semibold text-sm transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-top border-[var(--border)] text-center">
          <p className="text-[var(--text-4)] text-[11px]">
            &copy; 2026 The Carcino Foundation. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
