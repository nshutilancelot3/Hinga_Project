'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiPost, getApiError } from '@/lib/api';
import { DISTRICTS } from '@/lib/districts';
import PasswordField from '@/components/PasswordField';

const FIELD_LABEL_KEYS: Record<string, string> = {
  full_name: 'fullName',
  email: 'email',
  password: 'password',
  role: 'role',
  district: 'district',
};

const ERROR_MESSAGE_KEYS: Record<string, string> = {
  EMAIL_TAKEN: 'emailTaken',
  INVALID_ROLE: 'invalidRole',
  PASSWORD_TOO_SHORT: 'passwordTooShort',
};

const inputClass =
  'w-full border border-hinga-green/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-hinga-green';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const tn = useTranslations('nav');
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('farmer');
  const [district, setDistrict] = useState(DISTRICTS[0]);
  const [languagePref, setLanguagePref] = useState('rw');
  const [error, setError] = useState<{ code: string; field?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  function errorText() {
    if (!error) return '';
    if (error.code === 'MISSING_FIELD') {
      const labelKey = error.field ? FIELD_LABEL_KEYS[error.field] : undefined;
      return t('errors.missingField', { field: labelKey ? t(labelKey) : error.field ?? '' });
    }
    const key = ERROR_MESSAGE_KEYS[error.code];
    return key ? t(`errors.${key}`) : t('errors.generic');
  }

  function selectLanguage(locale: string) {
    setLanguagePref(locale);
    document.cookie = `locale=${locale}; path=/`;
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiPost('/auth/register', {
        full_name: fullName,
        email,
        password,
        role,
        district,
        language_pref: languagePref,
      });
      router.push('/login');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-hinga-cream py-10">
      <div className="bg-white border border-hinga-green/10 shadow-sm rounded-xl p-8 w-full max-w-sm">
        <h1 className="text-xl font-semibold text-hinga-ink mb-6">{t('registerTitle')}</h1>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm text-hinga-inkMuted mb-1">{t('fullName')}</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-hinga-inkMuted mb-1">{t('email')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-hinga-inkMuted mb-1">{t('password')}</label>
            <PasswordField required minLength={8} value={password} onChange={setPassword} />
          </div>
          <div>
            <label className="block text-sm text-hinga-inkMuted mb-1">{t('role')}</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={inputClass}
            >
              <option value="farmer">{t('roles.farmer')}</option>
              <option value="buyer">{t('roles.buyer')}</option>
              <option value="coop_admin">{t('roles.coop_admin')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-hinga-inkMuted mb-1">{t('district')}</label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className={inputClass}
            >
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-hinga-inkMuted mb-1">{t('languagePref')}</label>
            <select
              value={languagePref}
              onChange={(e) => selectLanguage(e.target.value)}
              className={inputClass}
            >
              <option value="rw">{t('languages.rw')}</option>
              <option value="en">{t('languages.en')}</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{errorText()}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-hinga-green text-white rounded-lg py-2 text-sm font-medium hover:bg-hinga-greenDark disabled:opacity-60"
          >
            {loading ? tc('loading') : t('registerButton')}
          </button>
        </form>
        <p className="text-sm text-hinga-inkMuted text-center mt-4">
          {t('hasAccount')}{' '}
          <Link href="/login" className="text-hinga-green hover:underline">{tn('login')}</Link>
        </p>
      </div>
    </div>
  );
}
