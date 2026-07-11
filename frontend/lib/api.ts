const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const KNOWN_ERRORS = ['invalidCredentials', 'emailTaken'];

export async function apiPost(path: string, body: object) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? 'generic');
  }

  return data;
}

export function getErrorKey(err: unknown) {
  const message = err instanceof Error ? err.message : '';
  return KNOWN_ERRORS.includes(message) ? message : 'generic';
}
