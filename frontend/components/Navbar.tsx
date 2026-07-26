'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { isLoggedIn, getCurrentUser, logout } from '@/lib/api';

function SproutMark() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className="transition-transform duration-300 ease-out group-hover:-rotate-6 group-hover:scale-110"
    >
      <path d="M14 25V13" stroke="#1F6B3A" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="9" cy="12" rx="5" ry="3" transform="rotate(-38 9 12)" fill="#2E8B4E" />
      <ellipse cx="19" cy="10" rx="5" ry="3" transform="rotate(38 19 10)" fill="#1F6B3A" />
    </svg>
  );
}

export default function Navbar() {
  const t = useTranslations('nav');
  const locale = useLocale();
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

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function navLinkClass(href: string) {
    return isActive(href)
      ? 'relative font-semibold text-hinga-ink after:absolute after:-bottom-[13px] after:left-0 after:right-0 after:h-[2px] after:bg-hinga-terracotta after:content-[""]'
      : 'text-hinga-inkMuted hover:text-hinga-ink transition-colors';
  }

  const navLinks = (
    <>
      <Link href="/prices" className={navLinkClass('/prices')}>{t('prices')}</Link>
      <Link href="/weather" className={navLinkClass('/weather')}>{t('weather')}</Link>
      <Link href="/diagnosis" className={navLinkClass('/diagnosis')}>{t('diagnosis')}</Link>
      <Link href="/marketplace" className={navLinkClass('/marketplace')}>{t('marketplace')}</Link>
      {loggedIn && user?.role === 'farmer' && (
        <Link href="/enquiries" className={navLinkClass('/enquiries')}>{t('enquiries')}</Link>
      )}
      {loggedIn && user?.role === 'super_admin' && (
        <Link href="/admin" className={navLinkClass('/admin')}>{t('admin')}</Link>
      )}
    </>
  );

  const localeSwitch = (
    <div className="flex items-center rounded-full bg-hinga-cream border border-hinga-green/15 p-0.5 text-xs font-medium">
      <button
        onClick={() => switchLocale('rw')}
        className={`px-2.5 py-1 rounded-full ${locale === 'rw' ? 'bg-hinga-green text-white' : 'text-hinga-inkMuted hover:text-hinga-ink'}`}
      >
        RW
      </button>
      <button
        onClick={() => switchLocale('en')}
        className={`px-2.5 py-1 rounded-full ${locale === 'en' ? 'bg-hinga-green text-white' : 'text-hinga-inkMuted hover:text-hinga-ink'}`}
      >
        EN
      </button>
    </div>
  );

  const authLinks = loggedIn ? (
    <button onClick={handleLogout} className="text-hinga-terracotta font-medium hover:text-hinga-ink text-left">
      {t('logout')}
    </button>
  ) : (
    <>
      <Link href="/login" className="text-hinga-inkMuted hover:text-hinga-ink">{t('login')}</Link>
      <Link
        href="/register"
        className="px-3.5 py-1.5 bg-hinga-green text-white rounded-lg hover:bg-hinga-greenDark text-center font-medium"
      >
        {t('register')}
      </Link>
    </>
  );

  return (
    <nav className="bg-white border-b border-hinga-green/10 shadow-sm px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        <Link href="/" className="group flex items-center gap-2">
          <SproutMark />
          <span className="text-hinga-green font-semibold text-lg tracking-tight transition-colors group-hover:text-hinga-greenDark">
            Hinga
          </span>
        </Link>

        {/* Desktop nav: everything on one line from md up */}
        <div className="hidden md:flex items-center gap-7 text-sm">{navLinks}</div>
        <div className="hidden md:flex items-center gap-4 text-sm">
          {localeSwitch}
          {authLinks}
        </div>

        {/* Mobile: hamburger toggle, below md */}
        <button
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? t('closeMenu') : t('openMenu')}
          aria-expanded={menuOpen}
          className="md:hidden p-2 -mr-2 text-hinga-inkMuted hover:text-hinga-ink"
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
        <div className="md:hidden mt-3 pt-3 border-t border-hinga-green/10 flex flex-col gap-4 text-sm">
          <div className="flex flex-col gap-3">{navLinks}</div>
          {localeSwitch}
          <div className="flex flex-col gap-2">{authLinks}</div>
        </div>
      )}
    </nav>
  );
}
