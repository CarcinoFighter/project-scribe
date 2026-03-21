import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.SYNC_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { 
      id, username, email, name, avatar_url, 
      position, department, description, 
      admin_access, is_active 
    } = await req.json();

    if (!id || !email) {
      return NextResponse.json({ error: 'Missing ID or email' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert({
        id,
        username,
        email,
        name,
        avatar_url,
        position,
        department,
        description,
        admin_access: !!admin_access,
        is_active: is_active !== false,
        synced_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Sync error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
