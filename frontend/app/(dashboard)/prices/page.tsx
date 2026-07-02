import { getTranslations } from 'next-intl/server';

export default async function PricesPage() {
  const t = await getTranslations('prices');
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">{t('title')}</h1>
    </div>
  );
}
