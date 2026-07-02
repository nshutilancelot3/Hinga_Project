'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const t = useTranslations('nav');
  const router = useRouter();

  function switchLocale(locale: string) {
    document.cookie = `locale=${locale}; path=/`;
    router.refresh();
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link href="/" className="text-green-700 font-semibold text-lg tracking-tight">
        Hinga
      </Link>

      <div className="flex items-center gap-6 text-sm">
        <Link href="/prices" className="text-gray-600 hover:text-green-700">{t('prices')}</Link>
        <Link href="/weather" className="text-gray-600 hover:text-green-700">{t('weather')}</Link>
        <Link href="/diagnosis" className="text-gray-600 hover:text-green-700">{t('diagnosis')}</Link>
        <Link href="/marketplace" className="text-gray-600 hover:text-green-700">{t('marketplace')}</Link>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <button
          onClick={() => switchLocale('rw')}
          className="px-3 py-1 rounded border border-gray-300 hover:bg-green-50 hover:border-green-400 text-gray-600"
        >
          RW
        </button>
        <button
          onClick={() => switchLocale('en')}
          className="px-3 py-1 rounded border border-gray-300 hover:bg-green-50 hover:border-green-400 text-gray-600"
        >
          EN
        </button>
        <Link href="/login" className="text-gray-600 hover:text-green-700">{t('login')}</Link>
        <Link href="/register" className="px-3 py-1 bg-green-700 text-white rounded hover:bg-green-800">
          {t('register')}
        </Link>
      </div>
    </nav>
  );
}
