import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import Navbar from '@/components/Navbar';

export default async function HomePage() {
  const t = await getTranslations('home');
  const tn = await getTranslations('nav');
  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
        <h1 className="text-3xl sm:text-4xl font-semibold text-green-700 mb-4">Hinga</h1>
        <p className="text-gray-500 text-base sm:text-lg mb-10 max-w-xl mx-auto">
          {t('tagline')}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/register" className="px-6 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 text-sm font-medium">
            {tn('register')}
          </Link>
          <Link href="/login" className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
            {tn('login')}
          </Link>
        </div>
      </main>
    </>
  );
}
