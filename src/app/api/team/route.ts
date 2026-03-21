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

  // Fetch all active users
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id, name, username, avatar_url, position, department, is_active, admin_access')
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
  }

  return NextResponse.json({ users });
}
