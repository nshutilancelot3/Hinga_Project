'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { apiGet, getRawError } from '@/lib/api';
import { translateCrop } from '@/lib/crops';
import { formatShortDate } from '@/lib/dateFormat';
import PriceTrendChart from '@/components/PriceTrendChart';
import MarketOverviewChart from '@/components/MarketOverviewChart';

type MarketPrice = {
  price_id: string;
  market_name: string;
  crop_type: string;
  price_rwf: string;
  unit: string;
  recorded_at: string;
};

function PriceTagIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1F6B3A" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2 3 11v2l9 9 10-10V4a2 2 0 0 0-2-2h-8Z" />
      <circle cx="15.5" cy="7.5" r="1.2" fill="#1F6B3A" stroke="none" />
    </svg>
  );
}

const selectClass =
  'border border-hinga-green/20 rounded-lg px-3 py-2 text-sm bg-white transition-colors focus:outline-none focus:border-hinga-green';

export default function PricesPage() {
  const t = useTranslations('prices');
  const tc = useTranslations('common');
  const locale = useLocale();

  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorRaw, setErrorRaw] = useState('');
  const [hasError, setHasError] = useState(false);
  const [cropFilter, setCropFilter] = useState('');
  const [marketFilter, setMarketFilter] = useState('');

  useEffect(() => {
    apiGet('/prices')
      .then(setPrices)
      .catch((err) => {
        setErrorRaw(getRawError(err));
        setHasError(true);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const crops = useMemo(
    () => Array.from(new Set(prices.map((p) => p.crop_type))).sort(),
    [prices]
  );
  const markets = useMemo(
    () => Array.from(new Set(prices.map((p) => p.market_name))).sort(),
    [prices]
  );

  const rows = prices.filter(
    (p) =>
      (!cropFilter || p.crop_type === cropFilter) &&
      (!marketFilter || p.market_name === marketFilter)
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold text-hinga-ink mb-6">{t('title')}</h1>

      <div className="flex flex-wrap gap-3 mb-4">
        <div>
          <label className="block text-sm text-hinga-inkMuted mb-1">{t('filterCrop')}</label>
          <select
            value={cropFilter}
            onChange={(e) => setCropFilter(e.target.value)}
            className={selectClass}
          >
            <option value="">{t('allCrops')}</option>
            {crops.map((crop) => (
              <option key={crop} value={crop}>{translateCrop(crop, locale)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-hinga-inkMuted mb-1">{t('filterMarket')}</label>
          <select
            value={marketFilter}
            onChange={(e) => setMarketFilter(e.target.value)}
            className={selectClass}
          >
            <option value="">{t('allMarkets')}</option>
            {markets.map((market) => (
              <option key={market} value={market}>{market}</option>
            ))}
          </select>
        </div>
      </div>

      {hasError && <p className="text-sm text-red-600 mb-4">{errorRaw || tc('error')}</p>}

      {!loading && !hasError && prices.length > 0 && (
        <div className="mb-4">
          {cropFilter ? (
            <PriceTrendChart
              prices={prices.filter((p) => p.crop_type === cropFilter)}
              cropType={cropFilter}
            />
          ) : (
            <MarketOverviewChart prices={prices} onSelectCrop={setCropFilter} />
          )}
        </div>
      )}

      <div className="overflow-x-auto bg-white border border-hinga-green/10 shadow-sm rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-hinga-inkMuted border-b border-hinga-green/10">
              <th className="px-4 py-3 font-medium">{t('market')}</th>
              <th className="px-4 py-3 font-medium">{t('crop')}</th>
              <th className="px-4 py-3 font-medium">{t('price')}</th>
              <th className="px-4 py-3 font-medium">{t('date')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-hinga-green/5 animate-pulse">
                  {[...Array(4)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-hinga-green/10 rounded w-24" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-hinga-inkMuted">
                  {t('empty')}
                </td>
              </tr>
            ) : (
              rows.map((p, i) => (
                <tr
                  key={p.price_id}
                  style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}
                  className="rise-in group border-b border-hinga-green/5 last:border-b-0 transition-colors hover:bg-hinga-green/[0.04]"
                >
                  <td className="px-4 py-3 text-hinga-ink">{p.market_name}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-hinga-ink">
                      <span className="text-hinga-green/50 transition-transform duration-200 group-hover:scale-110 group-hover:text-hinga-green">
                        <PriceTagIcon />
                      </span>
                      {translateCrop(p.crop_type, locale)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-hinga-green tabular-nums">
                    {Number(p.price_rwf).toLocaleString(locale)}
                    <span className="font-normal text-hinga-inkMuted">/{p.unit}</span>
                  </td>
                  <td className="px-4 py-3 text-hinga-inkMuted">
                    {formatShortDate(new Date(p.recorded_at))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
