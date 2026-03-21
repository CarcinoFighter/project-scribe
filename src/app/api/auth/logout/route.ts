import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('cw_token')?.value;

    if (token) {
      // Mark session revoked in DB
      await supabaseAdmin
        .from('login_sessions')
        .update({ revoked: true })
        .eq('token', token);
    }

    // Clear cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('cw_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
