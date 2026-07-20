'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiPost, getRawError } from '@/lib/api';

export default function LoginPage() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const tn = useTranslations('nav');
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorRaw, setErrorRaw] = useState('');
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setHasError(false);
    setLoading(true);

    try {
      const data = await apiPost('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/prices');
    } catch (err) {
      setErrorRaw(getRawError(err));
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white border border-gray-200 rounded-xl p-8 w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-6">{t('loginTitle')}</h1>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm text-gray-600 mb-1">{t('email')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">{t('password')}</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
            />
          </div>
          {hasError && <p className="text-sm text-red-600">{errorRaw || t('errors.generic')}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-green-700 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-800 disabled:opacity-60"
          >
            {loading ? tc('loading') : t('loginButton')}
          </button>
        </form>
        <p className="text-sm text-gray-500 text-center mt-4">
          {t('noAccount')}{' '}
          <Link href="/register" className="text-green-700 hover:underline">{tn('register')}</Link>
        </p>
      </div>
    </div>
  );
}
