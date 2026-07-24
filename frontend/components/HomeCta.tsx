'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { isLoggedIn } from '@/lib/api';

export default function HomeCta() {
  const t = useTranslations('home');
  const tn = useTranslations('nav');
  const pathname = usePathname();

  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
  }, [pathname]);

  if (loggedIn) {
    return (
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          href="/marketplace"
          className="px-6 py-2 bg-hinga-green text-white rounded-lg hover:bg-hinga-greenDark text-sm font-medium"
        >
          {t('browseCta')}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-4">
      <Link href="/register" className="px-6 py-2 bg-hinga-green text-white rounded-lg hover:bg-hinga-greenDark text-sm font-medium">
        {tn('register')}
      </Link>
      <Link href="/login" className="px-6 py-2 border border-hinga-green/20 text-hinga-ink rounded-lg hover:bg-hinga-green/5 text-sm font-medium">
        {tn('login')}
      </Link>
    </div>
  );
}
