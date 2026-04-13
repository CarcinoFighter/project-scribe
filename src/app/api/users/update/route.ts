import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('cw_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { name, avatar_url, metadata } = await req.json();
  const updateData: any = { updated_at: new Date().toISOString() };

  if (name) updateData.name = name;
  if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
  if (metadata !== undefined) updateData.metadata = metadata;

  const { data, error } = await supabaseAdmin
    .from('users')
    .update(updateData)
    .eq('id', payload.userId)
    .select()
    .single();

  if (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, user: data });
}

