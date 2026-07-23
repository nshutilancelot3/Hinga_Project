import { getTranslations } from 'next-intl/server';

function PricesIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1F6B3A" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20V14" />
      <path d="M11 20V9" />
      <path d="M18 20V4" />
    </svg>
  );
}

function WeatherIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1F6B3A" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="8" r="3.2" />
      <path d="M9.5 17h8a3.5 3.5 0 0 0 0-7 5 5 0 0 0-9.5-1.8" />
    </svg>
  );
}

function DiagnosisIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1F6B3A" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21V11" />
      <path d="M12 11C12 6 8 4 4 4C4 8 7 12 12 12Z" />
      <path d="M15.5 20a4.5 4.5 0 0 0 4.5-4.5" />
    </svg>
  );
}

function MarketplaceIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1F6B3A" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9h16l-1.5 10.5a1 1 0 0 1-1 .5H6.5a1 1 0 0 1-1-.5L4 9Z" />
      <path d="M8 9V7a4 4 0 0 1 8 0v2" />
    </svg>
  );
}

const FEATURES = [
  { key: 'prices', Icon: PricesIcon },
  { key: 'weather', Icon: WeatherIcon },
  { key: 'diagnosis', Icon: DiagnosisIcon },
  { key: 'marketplace', Icon: MarketplaceIcon },
] as const;

export default async function HomeFeatures() {
  const t = await getTranslations('home.features');

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
      <h2 className="text-center text-sm font-semibold tracking-wide text-hinga-terracotta mb-10">
        {t('sectionTitle')}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
        {FEATURES.map(({ key, Icon }) => (
          <div key={key} className="text-center sm:text-left">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-hinga-green/10 mb-4">
              <Icon />
            </div>
            <h3 className="font-semibold text-hinga-ink mb-1.5">{t(`${key}.title`)}</h3>
            <p className="text-sm text-hinga-inkMuted leading-relaxed">{t(`${key}.description`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
