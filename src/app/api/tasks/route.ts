import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { unstable_cache } from 'next/cache';

// Cache specifically based on whether it's a global or user-specific fetch
const getAssignmentsCached = unstable_cache(
  async (userId: string, isLeadership: boolean) => {
    let query = supabaseAdmin.from('work_assignments').select('*');
    
    if (!isLeadership) {
      query = query.or(`assigned_to.eq.${userId},assigned_to_ids.cs.{${userId}}`);
    }

    const { data: assignments, error } = await query.order('due_date', { ascending: true });

    if (error) throw error;
    return assignments;
  },
  ['user-assignments'],
  { revalidate: 300 } // 5 minutes
);

export async function GET(req: NextRequest) {
  const token = req.cookies.get('cw_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    // 1. Fetch user department to check for Leadership
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('department')
      .eq('id', payload.userId)
      .single();

    if (userError) throw userError;

    const isLeadership = payload.adminAccess || userData.department === 'Leadership';
    
    // 2. Fetch assignments (conditional based on leadership status)
    const assignments = await getAssignmentsCached(payload.userId, isLeadership);
    
    return NextResponse.json({ assignments });
  } catch (error: any) {
    console.error('Fetch assignments error:', error);
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}


export async function PATCH(req: NextRequest) {
  const token = req.cookies.get('cw_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    const { 
      id, status, submission_media_url, 
      assigned_to_ids, priority, due_date, title, description,
      proofreader_id, type 
    } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const updateData: any = {
      updated_at: new Date().toISOString() 
    };

    if (status !== undefined) updateData.status = status;
    if (proofreader_id !== undefined) updateData.proofreader_id = proofreader_id;

    // Determine target table and filter table-specific columns
    let table = 'work_assignments';
    if (type === 'blogs') table = 'blogs';
    else if (type === 'survivor_stories') table = 'survivor_stories';
    else if (type === 'cancer_docs') table = 'cancer_docs';

    // Columns only for work_assignments
    if (table === 'work_assignments') {
      if (priority !== undefined) updateData.priority = priority;
      if (due_date !== undefined) updateData.due_date = due_date;
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (assigned_to_ids !== undefined && payload.adminAccess) {
        updateData.assigned_to_ids = assigned_to_ids;
      }
      if (submission_media_url !== undefined) {
        updateData.submission_media_url = submission_media_url;
        updateData.submitted_at = new Date().toISOString();
      }
    }

    let query = supabaseAdmin
      .from(table)
      .update(updateData)
      .eq('id', id);

    if (!payload.adminAccess && table === 'work_assignments') {
      query = query.or(`assigned_to.eq.${payload.userId},assigned_to_ids.cs.{${payload.userId}}`);
    }

    const { data, error } = await query.select();

    if (error) {
      console.error('Update operation error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'No records updated' }, { status: 404 });
    }

    const updated = data[0];

    // Notification Logic
    if (submission_media_url !== undefined && updated.assigned_by) {
      const { notifyUser } = await import('@/lib/pushNotify');
      await notifyUser(updated.assigned_by, {
        title: '📤 Task submitted',
        body: `"${updated.title}" has been submitted for review.`,
        url: '/queues',
      }).catch(e => console.error('Notify assigner failed:', e));
    }

    return NextResponse.json({ success: true, assignment: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get('cw_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload || !payload.adminAccess) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  try {
    // Verify that the current user assigned the task
    const { data: task, error: fetchError } = await supabaseAdmin
      .from('work_assignments')
      .select('assigned_by')
      .eq('id', id)
      .single();

    if (fetchError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (task.assigned_by !== payload.userId) {
      return NextResponse.json({ error: 'You can only delete tasks you assigned' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('work_assignments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete assignment error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

