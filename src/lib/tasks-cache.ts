/**
 * Simple session-persistent cache for tasks/assignments.
 * Persists data across page refreshes within the same browser session.
 */

const SESSION_PREFIX = 'cv_tasks_cache_';

export interface CachedTasks {
  assignments: any[];
  timestamp: number;
}

/**
 * Gets cached tasks from sessionStorage
 * @param key unique key for the cache (e.g., 'all' or 'mine')
 * @param ttl time to live in milliseconds (default 5 minutes)
 */
export function getCachedTasks(key: string, ttl: number = 300000): any[] | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const raw = sessionStorage.getItem(SESSION_PREFIX + key);
    if (!raw) return null;
    
    const parsed: CachedTasks = JSON.parse(raw);
    const now = Date.now();
    
    if (now - parsed.timestamp > ttl) {
      // Cache expired
      return null;
    }
    
    return parsed.assignments;
  } catch (err) {
    console.warn('[Cache] Failed to read from sessionStorage', err);
    return null;
  }
}

/**
 * Sets tasks in sessionStorage
 * @param key unique key for the cache
 * @param assignments the data to cache
 */
export function setCachedTasks(key: string, assignments: any[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    const payload: CachedTasks = {
      assignments,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(SESSION_PREFIX + key, JSON.stringify(payload));
  } catch (err) {
    console.warn('[Cache] Failed to write to sessionStorage', err);
  }
}

/**
 * Invalidates a specific cache or all task caches
 * @param key optional specific key to invalidate
 */
export function invalidateTasksCache(key?: string): void {
  if (typeof window === 'undefined') return;
  
  if (key) {
    sessionStorage.removeItem(SESSION_PREFIX + key);
  } else {
    // Clear all keys with our prefix
    Object.keys(sessionStorage).forEach(k => {
      if (k.startsWith(SESSION_PREFIX)) {
        sessionStorage.removeItem(k);
      }
    });
  }
}
