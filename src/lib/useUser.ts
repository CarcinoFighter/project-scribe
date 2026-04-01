'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  admin_access: boolean;
  department: string | null;
}

// Simple client-side cache for the user profile
let cachedUser: User | null = null;

export function useUser() {
  const [user, setUser] = useState<User | null>(cachedUser);
  const [loading, setLoading] = useState(!cachedUser);

  const fetchUser = async (_force = false) => {
    // If not forced and we have a cached user, we can resolve immediately 
    // but we'll still fetch in the background to stay fresh (SWR)
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        cachedUser = data.user;
        // Also persist to localStorage for cross-refresh instant load
        try { localStorage.setItem('cs-user-cache', JSON.stringify(data.user)); } catch {}
      } else {
        setUser(null);
        cachedUser = null;
        try { localStorage.removeItem('cs-user-cache'); } catch {}
      }
    } catch (_error) {
      // Keep existing user if fetch fails
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Check in-memory cache first (quickest)
    if (cachedUser) {
      setUser(cachedUser);
      setLoading(false);
    } 
    // 2. Check localStorage if in-memory is empty
    else {
      try {
        const saved = localStorage.getItem('cs-user-cache');
        if (saved) {
          const parsed = JSON.parse(saved);
          setUser(parsed);
          cachedUser = parsed;
          setLoading(false);
        }
      } catch {}
    }

    // 3. Always refresh from server in the background
    fetchUser();
  }, []);

  return { user, loading, refreshUser: () => fetchUser(true) };
}
