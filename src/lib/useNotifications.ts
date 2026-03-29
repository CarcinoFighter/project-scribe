'use client';

import { useState, useEffect, useCallback } from 'react';
import { Notif } from '@/components/NotifPanel';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        const apiNotifs = data.notifications || [];
        
        // Map DB fields to UI interface
        const mapped: Notif[] = apiNotifs.map((n: any) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          time: new Date(n.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          read: n.read,
          url: n.url
        }));

        setNotifications(mapped);
        setUnreadCount(mapped.filter(n => !n.read).length);
      }
    } catch (err) {
      console.error('[useNotifications] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
    } catch (err) {
      console.error('[useNotifications] markAllRead error:', err);
      // Revert on error? For now, we'll keep it simple
    }
  }, []);

  const markRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch (err) {
      console.error('[useNotifications] markRead error:', err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Optional: Poll every 60 seconds for new notifications
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAllRead,
    markRead
  };
}
