'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ApplicationsDashboard } from '@/components/ApplicationsDashboard';
import { useUser } from '@/lib/useUser';

export default function ApplicationsPage() {
  const router = useRouter();
  const { user, loading } = useUser();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!user.admin_access) {
      router.replace('/');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0a0b] text-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
      </main>
    );
  }

  if (!user || !user.admin_access) return null;

  return (
    <main className="min-h-screen bg-[#0a0a0b] text-white selection:bg-blue-500/30">
      <ApplicationsDashboard />
    </main>
  );
}
