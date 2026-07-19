import { getTranslations } from 'next-intl/server';

export default async function AdminPage() {
  const t = await getTranslations('nav');
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold mb-6">{t('admin')}</h1>
    </div>
  );
}
