import { getTranslations } from 'next-intl/server';

export default async function WeatherPage() {
  const t = await getTranslations('weather');
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">{t('title')}</h1>
    </div>
  );
}
