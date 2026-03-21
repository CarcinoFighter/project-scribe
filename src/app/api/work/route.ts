import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('cw_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // Fetch assignments where current user is the assignee
  const { data: assignments, error } = await supabaseAdmin
    .from('work_assignments')
    .select('*')
    .eq('assigned_to', payload.userId)
    .order('due_date', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }

  return NextResponse.json({ assignments });
}
