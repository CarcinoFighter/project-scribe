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
    const { id, status, submission_media_url } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updateData: any = {
      status, 
      updated_at: new Date().toISOString() 
    };

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

