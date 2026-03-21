import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { comparePassword, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Query users table
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!user.is_active) {
      return NextResponse.json({ error: 'Account is inactive' }, { status: 403 });
    }

    // Compare password
    const isMatch = await comparePassword(password, user.password || '');
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Sign JWT
    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      adminAccess: user.admin_access,
    });

    // Insert into login_sessions
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error: sessionError } = await supabaseAdmin
      .from('login_sessions')
      .insert({
        user_id: user.id,
        token: token,
        expires_at: expiresAt.toISOString(),
      });

    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    // Set httpOnly cookie
    const response = NextResponse.json({ 
      success: true, 
      user: { 
        id: user.id, 
        name: user.name, 
        avatar_url: user.avatar_url,
        admin_access: user.admin_access
      } 
    });

    response.cookies.set('cw_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
