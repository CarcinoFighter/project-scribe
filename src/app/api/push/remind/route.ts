import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendPushToUser } from '@/lib/pushNotify';

// Called by a cron job / scheduled task to send due-date reminders.
// Trigger: tasks due TODAY that haven't been completed.
// Endpoint: GET /api/push/remind   (protected by SYNC_SECRET)
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-sync-secret');
  if (secret !== process.env.SYNC_SECRET) {
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
    await sendPushToUser(task.assigned_to, {
      title: '⏰ Task due today!',
      body: task.title,
      tag: `reminder-${task.id}`,
      url: '/tasks',
    });
    sent++;
  }

  return NextResponse.json({ success: true, sent });
}
