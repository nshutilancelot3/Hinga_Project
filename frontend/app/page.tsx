import { getTranslations } from 'next-intl/server';
import Navbar from '@/components/Navbar';
import HomeCta from '@/components/HomeCta';
import HomeFeatures from '@/components/HomeFeatures';

export default async function HomePage() {
  const t = await getTranslations('home');
  return (
    <>
      <Navbar />
      <main>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-20 text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold text-hinga-green mb-4">Hinga</h1>
          <p className="text-hinga-inkMuted text-base sm:text-lg mb-10 max-w-xl mx-auto">
            {t('tagline')}
          </p>
          <HomeCta />
        </div>
        <HomeFeatures />
      </main>
    </>
  );
}
