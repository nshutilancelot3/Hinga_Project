'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiPost, getApiError } from '@/lib/api';
import PasswordField from '@/components/PasswordField';

export default function LoginPage() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const tn = useTranslations('nav');
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorCode, setErrorCode] = useState('');
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
      setErrorCode(getApiError(err).code);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-hinga-cream">
      <div className="bg-white border border-hinga-green/10 shadow-sm rounded-xl p-8 w-full max-w-sm">
        <h1 className="text-xl font-semibold text-hinga-ink mb-6">{t('loginTitle')}</h1>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm text-hinga-inkMuted mb-1">{t('email')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-hinga-green/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-hinga-green"
            />
          </div>
          <div>
            <label className="block text-sm text-hinga-inkMuted mb-1">{t('password')}</label>
            <PasswordField required value={password} onChange={setPassword} />
          </div>
          {hasError && (
            <p className="text-sm text-red-600">
              {errorCode === 'INVALID_CREDENTIALS' ? t('errors.invalidCredentials') : t('errors.generic')}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="bg-hinga-green text-white rounded-lg py-2 text-sm font-medium hover:bg-hinga-greenDark disabled:opacity-60"
          >
            {loading ? tc('loading') : t('loginButton')}
          </button>
        </form>
        <p className="text-sm text-hinga-inkMuted text-center mt-4">
          {t('noAccount')}{' '}
          <Link href="/register" className="text-hinga-green hover:underline">{tn('register')}</Link>
        </p>
      </div>
    </div>
  );
}
