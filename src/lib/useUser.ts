'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  avatar_url: string | null;
  admin_access: boolean;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        // We can create a simple /api/auth/me endpoint or just check cookies (but client can't see httpOnly)
        // So an endpoint is better.
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  return { user, loading };
}
