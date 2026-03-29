import webpush from 'web-push';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

webpush.setVapidDetails(
  'mailto:admin@carcino.work',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
}

/**
 * Internal function to send the actual push notification.
 */
async function sendPushToUser(userId: string, payload: PushPayload) {
  const { data: subs, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId);

  if (error || !subs?.length) return;

  const message = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon ?? '/logo.png',
    badge: payload.badge ?? '/logo.png',
    tag: payload.tag,
    data: { url: payload.url ?? '/' },
  });

  await Promise.allSettled(
    subs.map(async (sub) => {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };
      try {
        await webpush.sendNotification(pushSub, message);
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabaseAdmin
            .from('push_subscriptions')
            .delete()
            .match({ user_id: userId, endpoint: sub.endpoint });
        }
      }
    })
  );
}

/**
 * Unified notification sender: Sends a push and saves to DB for the bell icon.
 */
export async function notifyUser(userId: string, payload: PushPayload) {
  // 1. Save to database for the Bell Icon UI
  const { error: dbError } = await supabaseAdmin
    .from('notifications')
    .insert({
      user_id: userId,
      title: payload.title,
      body: payload.body,
      url: payload.url,
      read: false,
    });

  if (dbError) {
    console.warn('[notifyUser] failed to save to DB:', dbError.message);
  }

  // 2. Send the Push Notification
  try {
    await sendPushToUser(userId, payload);
  } catch (pushErr) {
    console.warn('[notifyUser] push failed:', pushErr);
  }
}
