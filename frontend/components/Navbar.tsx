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
  const [menuOpen, setMenuOpen] = useState(false);

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
    setMenuOpen(false);
    router.push('/login');
  }

  const navLinks = (
    <>
      <Link href="/prices" className="text-gray-600 hover:text-green-700">{t('prices')}</Link>
      <Link href="/weather" className="text-gray-600 hover:text-green-700">{t('weather')}</Link>
      <Link href="/diagnosis" className="text-gray-600 hover:text-green-700">{t('diagnosis')}</Link>
      <Link href="/marketplace" className="text-gray-600 hover:text-green-700">{t('marketplace')}</Link>
      {loggedIn && user?.role === 'super_admin' && (
        <Link href="/admin" className="text-gray-600 hover:text-green-700">{t('admin')}</Link>
      )}
    </>
  );

  const localeSwitch = (
    <div className="flex items-center gap-3">
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
    </div>
  );

  const authLinks = loggedIn ? (
    <button onClick={handleLogout} className="text-gray-600 hover:text-green-700 text-left">
      {t('logout')}
    </button>
  ) : (
    <>
      <Link href="/login" className="text-gray-600 hover:text-green-700">{t('login')}</Link>
      <Link
        href="/register"
        className="px-3 py-1 bg-green-700 text-white rounded hover:bg-green-800 text-center"
      >
        {t('register')}
      </Link>
    </>
  );

  return (
    <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-green-700 font-semibold text-lg tracking-tight">
          Hinga
        </Link>

        {/* Desktop nav: everything on one line from md up */}
        <div className="hidden md:flex items-center gap-6 text-sm">{navLinks}</div>
        <div className="hidden md:flex items-center gap-3 text-sm">
          {localeSwitch}
          {authLinks}
        </div>

        {/* Mobile: hamburger toggle, below md */}
        <button
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? t('closeMenu') : t('openMenu')}
          aria-expanded={menuOpen}
          className="md:hidden p-2 -mr-2 text-gray-600 hover:text-green-700"
        >
          {menuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-gray-100 flex flex-col gap-4 text-sm">
          <div className="flex flex-col gap-3">{navLinks}</div>
          {localeSwitch}
          <div className="flex flex-col gap-2">{authLinks}</div>
        </div>
      )}
    </nav>
  );
}
