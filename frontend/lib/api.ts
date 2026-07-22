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

export class ApiError extends Error {
  field?: string;
  constructor(code?: string, field?: string) {
    super(code);
    this.field = field;
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
    throw new ApiError(data?.error, data?.field);
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

export async function apiUpload(path: string, formData: FormData) {
  const res = await safeFetch(`${API_URL}/api${path}`, {
    method: 'POST',
    headers: authHeader(),
    body: formData,
  });
  return parseResponse(res);
}

export function isLoggedIn() {
  return typeof window !== 'undefined' && !!localStorage.getItem('token');
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
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

// Structured code + field for callers that translate error codes.
export function getApiError(err: unknown): { code: string; field?: string } {
  if (err instanceof ApiError) return { code: err.message, field: err.field };
  return { code: '' };
}
