'use client';

const DEFAULT_NATIVE_API_ORIGIN = 'https://www.carcino.work';

type MaybeCapacitor = {
  isNativePlatform?: () => boolean;
};

type MaybeWindow = {
  Capacitor?: MaybeCapacitor;
};

const normalizeOrigin = (origin?: string) => (origin ? origin.replace(/\/+$/, '') : '');

const isNativePlatform = () => {
  if (typeof window === 'undefined') return false;
  const cap = (window as unknown as MaybeWindow).Capacitor;
  return typeof cap?.isNativePlatform === 'function' ? !!cap.isNativePlatform() : false;
};

const apiOrigin = (() => {
  const envOrigin = normalizeOrigin(process.env.NEXT_PUBLIC_API_ORIGIN);
  const envNativeOrigin = normalizeOrigin(process.env.NEXT_PUBLIC_NATIVE_API_ORIGIN) || envOrigin;

  if (isNativePlatform()) {
    return envNativeOrigin || DEFAULT_NATIVE_API_ORIGIN;
  }

  return envOrigin;
})();

export function apiUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (!path.startsWith('/api')) return path;
  if (!apiOrigin) return path;
  return `${apiOrigin}${path}`;
}

export function apiFetch(path: string, init: RequestInit = {}) {
  const nextInit: RequestInit = { ...init };
  if (nextInit.credentials === undefined) {
    nextInit.credentials = 'include';
  }
  return fetch(apiUrl(path), nextInit);
}
