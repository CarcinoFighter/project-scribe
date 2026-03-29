import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notifyUser } from '@/lib/pushNotify';

// Called automatically by Vercel Cron (see vercel.json schedule).
// Also callable manually: GET /api/push/remind   Header: x-sync-secret: <SYNC_SECRET>
export async function GET(req: NextRequest) {
  // Vercel Cron automatically sends: Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.get('authorization');
  const manualSecret = req.headers.get('x-sync-secret');

  const cronSecretValid =
    authHeader === `Bearer ${process.env.CRON_SECRET}`;
  const manualSecretValid =
    manualSecret === process.env.SYNC_SECRET;

  if (!cronSecretValid && !manualSecretValid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const today = new Date().toISOString().split('T')[0];

  const { data: tasks, error } = await supabaseAdmin
    .from('work_assignments')
    .select('id, title, assigned_to, due_date')
    .eq('due_date', today)
    .neq('status', 'done');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let sent = 0;
  for (const task of tasks ?? []) {
    await notifyUser(task.assigned_to, {
      title: '⏰ Task due today!',
      body: task.title,
      url: '/tasks',
    });
    sent++;
  }

  return NextResponse.json({ success: true, sent });
}
