import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

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
    const { 
      assigned_to, 
      title, 
      description, 
      status, 
      priority, 
      due_date, 
      category, 
      department 
    } = await req.json();

    if (!assigned_to || !title || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('work_assignments')
      .insert({
        assigned_to,
        assigned_by: payload.userId,
        title,
        description: description || '',
        category,
        department: category === 'task' ? department : null,
        status: status || 'todo',
        priority: priority || 'normal',
        due_date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Assignment error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, assignment: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
