'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function LoginPage() {
  const t = useTranslations('auth');
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white border border-gray-200 rounded-xl p-8 w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-6">{t('loginTitle')}</h1>
        <form className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">{t('email')}</label>
            <input type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">{t('password')}</label>
            <input type="password" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
          </div>
          <button type="submit" className="bg-green-700 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-800">
            {t('loginButton')}
          </button>
        </form>
        <p className="text-sm text-gray-500 text-center mt-4">
          {t('noAccount')}{' '}
          <Link href="/register" className="text-green-700 hover:underline">{t('register')}</Link>
        </p>
      </div>
    </div>
  );
}
