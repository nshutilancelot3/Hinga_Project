import { getTranslations } from 'next-intl/server';
import Navbar from '@/components/Navbar';
import HomeCta from '@/components/HomeCta';

export default async function HomePage() {
  const t = await getTranslations('home');
  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
        <h1 className="text-3xl sm:text-4xl font-semibold text-green-700 mb-4">Hinga</h1>
        <p className="text-gray-500 text-base sm:text-lg mb-10 max-w-xl mx-auto">
          {t('tagline')}
        </p>
        <HomeCta />
      </main>
    </>
  );
}
