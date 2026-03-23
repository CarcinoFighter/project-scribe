'use client';

import { usePushSubscription } from '@/lib/usePushSubscription';

export default function PushSubscriber() {
  usePushSubscription();
  return null;
}
