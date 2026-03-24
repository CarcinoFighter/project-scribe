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
 * Send a push notification to a specific user.
 * Silently removes stale/expired subscriptions.
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  const { data: subs, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId);

  if (error || !subs?.length) return;

  const message = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon ?? '/icon-192.png',
    badge: payload.badge ?? '/icon-192.png',
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
        // 410 Gone = subscription expired; clean it up
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
