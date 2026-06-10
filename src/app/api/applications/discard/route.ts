import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('cw_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  // Fetch fresh user data from DB to check department and admin access
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('admin_access, department')
    .eq('id', payload.userId)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const isLeadership = user.department === 'Leadership';
  const isAdmin = user.admin_access;

  if (!isLeadership && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Leadership access required' }, { status: 403 });
  }

  try {
    const { timestamp } = await req.json();
    if (!timestamp) return NextResponse.json({ error: 'Timestamp is required' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('discarded_applications')
      .insert({ timestamp, discarded_by: payload.userId });

    if (error) {
      if (error.code === '23505') {
        // Unique violation, already discarded
        return NextResponse.json({ success: true });
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
