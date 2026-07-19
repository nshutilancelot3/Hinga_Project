const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function authHeader(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// A dead fetch() throws a raw browser message like "Failed to fetch" - normalize it away.
async function safeFetch(url: string, init: RequestInit) {
  try {
    return await fetch(url, init);
  } catch {
    throw new Error();
  }
}

async function parseResponse(res: Response) {
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(data?.error);
  }

  return data;
}

export async function apiGet(path: string) {
  const res = await safeFetch(`${API_URL}/api${path}`, {
    headers: authHeader(),
  });
  return parseResponse(res);
}

export async function apiPost(path: string, body: object) {
  const res = await safeFetch(`${API_URL}/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(body),
  });
  return parseResponse(res);
}

export function isLoggedIn() {
  return typeof window !== 'undefined' && !!localStorage.getItem('token');
}

export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

// Callers translate the fallback themselves so it stays live across a language switch.
export function getRawError(err: unknown) {
  return err instanceof Error ? err.message : '';
}
