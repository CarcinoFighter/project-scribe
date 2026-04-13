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

  // Update last_used_at for this session (fire-and-forget, non-blocking)
  supabaseAdmin
    .from('login_sessions')
    .update({ last_used_at: new Date().toISOString() })
    .eq('token', token)
    .eq('user_id', payload.userId)
    .then(({ error: sessionUpdateError }) => {
      if (sessionUpdateError) {
        console.warn('Failed to update last_used_at:', sessionUpdateError.message);
      }
    });

  // Fetch fresh user data from DB
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, name, email, avatar_url, admin_access, department, metadata')
    .eq('id', payload.userId)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user });
}

