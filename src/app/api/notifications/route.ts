import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GET: Fetch last 20 notifications for the current user
export async function GET(req: NextRequest) {
  const token = req.cookies.get('cw_token')?.value;
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('user_id', payload.userId)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ notifications: data });
}

// PATCH: Mark all as read OR mark specific as read
export async function PATCH(req: NextRequest) {
  const token = req.cookies.get('cw_token')?.value;
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const body = await req.json();
  const { id, all } = body;

  let query = supabaseAdmin.from('notifications').update({ read: true });

  if (all) {
    query = query.eq('user_id', payload.userId).eq('read', false);
  } else if (id) {
    query = query.eq('id', id).eq('user_id', payload.userId);
  } else {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const { error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
