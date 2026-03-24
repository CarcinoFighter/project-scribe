import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('cw_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // Fetch assignments where current user is in assigned_to_ids
  const { data: assignments, error } = await supabaseAdmin
    .from('work_assignments')
    .select('*')
    .or(`assigned_to.eq.${payload.userId},assigned_to_ids.cs.{${payload.userId}}`)
    .order('due_date', { ascending: true });

  if (error) {
    console.error('Fetch assignments error:', error);
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }

  return NextResponse.json({ assignments });
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
      assigned_to_ids, priority, due_date, title, description 
    } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const updateData: any = {
      updated_at: new Date().toISOString() 
    };

    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (due_date !== undefined) updateData.due_date = due_date;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;

    // Only admins can reassign generally
    if (payload.adminAccess && assigned_to_ids !== undefined) {
      updateData.assigned_to_ids = assigned_to_ids;
    }

    if (submission_media_url !== undefined) {
      updateData.submission_media_url = submission_media_url;
      updateData.submitted_at = new Date().toISOString();
    }

    let query = supabaseAdmin
      .from('work_assignments')
      .update(updateData)
      .eq('id', id);

    if (!payload.adminAccess) {
      query = query.or(`assigned_to.eq.${payload.userId},assigned_to_ids.cs.{${payload.userId}}`); // Ensure user can only update their own assignments
    }

    const { data, error } = await query.select().single();

    if (error) {
      console.error('Update assignment error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, assignment: data });
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

