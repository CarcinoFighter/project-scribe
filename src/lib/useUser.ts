'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  admin_access: boolean;
  department: string | null;
  metadata: any;
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
      } else {
        setUser(null);
        cachedUser = null;
      }
    } catch (_error) {
      // Keep existing user if fetch fails
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check in-memory cache first (quickest)
    if (cachedUser) {
      setUser(cachedUser);
      setLoading(false);
    } 

    // 3. Always refresh from server in the background
    fetchUser();
  }, []);

  const updateMetadata = async (newMetadata: any) => {
    try {
      const res = await fetch('/api/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata: newMetadata }),
      });
      if (res.ok) {
        await fetchUser(true);
        return true;
      }
    } catch (err) {
      console.error('Failed to update metadata:', err);
    }
    return false;
  };

  return { user, loading, refreshUser: () => fetchUser(true), updateMetadata };
}
