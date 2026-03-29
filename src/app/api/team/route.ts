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

  // Fetch all active users
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id, name, email, username, avatar_url, position, department, is_active, admin_access')
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
  }

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('cw_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // Double check that the requester is in Leadership department
  const { data: requester, error: requesterError } = await supabaseAdmin
    .from('users')
    .select('department')
    .eq('id', payload.userId)
    .single();

  if (requesterError || requester?.department !== 'Leadership') {
    return NextResponse.json({ error: 'Unauthorized: Only Leadership can invite' }, { status: 403 });
  }

  try {
    const { name, email, username, password, position, department, admin_access } = await req.json();

    if (!name || !email || !username || !password || !department) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Hash password
    const { hashPassword } = await import('@/lib/auth');
    const hashedPassword = await hashPassword(password);

    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        name,
        email,
        username,
        password: hashedPassword,
        position: position || 'Contributor',
        department: department,
        admin_access: !!admin_access,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Invite error:', insertError);
      return NextResponse.json({ error: insertError.message || 'Failed to create user' }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: newUser });
  } catch (err) {
    console.error('Invite catch error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
