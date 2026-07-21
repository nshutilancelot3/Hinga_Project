'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { isLoggedIn, getCurrentUser, logout } from '@/lib/api';

export default function Navbar() {
  const t = useTranslations('nav');
  const router = useRouter();
  const pathname = usePathname();

  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<{ role?: string } | null>(null);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    setUser(getCurrentUser());
  }, [pathname]);

  function switchLocale(locale: string) {
    document.cookie = `locale=${locale}; path=/`;
    router.refresh();
  }

  function handleLogout() {
    logout();
    setLoggedIn(false);
    setUser(null);
    router.push('/login');
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
        {loggedIn && user?.role === 'super_admin' && (
          <Link href="/admin" className="text-gray-600 hover:text-green-700">{t('admin')}</Link>
        )}
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
        {loggedIn ? (
          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-green-700"
          >
            {t('logout')}
          </button>
        ) : (
          <>
            <Link href="/login" className="text-gray-600 hover:text-green-700">{t('login')}</Link>
            <Link href="/register" className="px-3 py-1 bg-green-700 text-white rounded hover:bg-green-800">
              {t('register')}
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
