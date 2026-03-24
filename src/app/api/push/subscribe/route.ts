import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Store push subscription for a user
export async function POST(req: NextRequest) {
  const token = req.cookies.get('cw_token')?.value;
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const subscription = await req.json();
  if (!subscription?.endpoint) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
  }

  // Upsert subscription — one per user+endpoint combo
  const { error } = await supabaseAdmin
    .from('push_subscriptions')
    .upsert({
      user_id: payload.userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys?.p256dh,
      auth: subscription.keys?.auth,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,endpoint' });

  if (error) {
    console.error('Push subscribe error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// Delete subscription (unsubscribe)
export async function DELETE(req: NextRequest) {
  const token = req.cookies.get('cw_token')?.value;
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const { endpoint } = await req.json();
  await supabaseAdmin
    .from('push_subscriptions')
    .delete()
    .match({ user_id: payload.userId, endpoint });

  return NextResponse.json({ success: true });
}
