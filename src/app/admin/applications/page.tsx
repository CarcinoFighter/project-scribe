import { ApplicationsDashboard } from '@/components/ApplicationsDashboard';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ApplicationsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('cw_token')?.value;

  if (!token) {
    redirect('/login');
  }

  const payload = verifyToken(token);
  if (!payload) {
    redirect('/login');
  }

  // Check admin access
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('admin_access')
    .eq('id', payload.userId)
    .single();

  if (userError || !user?.admin_access) {
    redirect('/');
  }

  return (
    <main className="min-h-screen bg-[#0a0a0b] text-white selection:bg-blue-500/30">
      <ApplicationsDashboard />
    </main>
  );
}
