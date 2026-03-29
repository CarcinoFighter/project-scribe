import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('cw_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload || !payload.adminAccess) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const { id, reviewer_note, status } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // First fetch the task to get the submission media
    const { data: task, error: fetchError } = await supabaseAdmin
      .from('work_assignments')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const newStatus = status || 'done';

    // Update the task to done
    const { data, error } = await supabaseAdmin
      .from('work_assignments')
      .update({ 
        status: newStatus, 
        reviewer_id: payload.userId,
        reviewer_note: reviewer_note || null,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // If approving, delete the file from storage bucket 'task-submissions'
    if (newStatus === 'done' && task.submission_media_url) {
      try {
        const urlObj = new URL(task.submission_media_url);
        const match = urlObj.pathname.match(/\/task-submissions\/(.+)$/);
        if (match && match[1]) {
          const filePath = decodeURIComponent(match[1]);
          await supabaseAdmin.storage.from('task-submissions').remove([filePath]);
          await supabaseAdmin.from('work_assignments').update({ submission_media_url: null }).eq('id', id);
        }
      } catch (e) {
        console.error("Failed to delete task submission media:", e);
      }
    }

    // Notification Logic for assignee
    if (newStatus === 'done' && data && data.assigned_to) {
      const { notifyUser } = await import('@/lib/pushNotify');
      await notifyUser(data.assigned_to, {
        title: '✅ Task Approved',
        body: `"${data.title}" has been approved.`,
        url: '/tasks',
      }).catch(e => console.error('Notify assignee failed:', e));
    }

    return NextResponse.json({ success: true, assignment: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

