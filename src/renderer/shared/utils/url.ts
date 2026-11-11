import { ALLOWED_PROTOCOLS } from '../constants';

export function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let candidate = trimmed;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  try {
    const url = new URL(candidate);
    if (!ALLOWED_PROTOCOLS.includes(url.protocol)) return null;
    if (url.protocol === 'file:') {
      return url.href;
    }
    if (!url.hostname) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function displayUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.protocol === 'file:') return u.pathname;
    return `${u.host}${u.pathname === '/' ? '' : u.pathname}`;
  } catch {
    return url;
  }
}
