'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { apiGet, getRawError } from '@/lib/api';
import { translateCrop } from '@/lib/crops';
import { formatShortDate } from '@/lib/dateFormat';
import PriceTrendChart from '@/components/PriceTrendChart';

type MarketPrice = {
  price_id: string;
  market_name: string;
  crop_type: string;
  price_rwf: string;
  unit: string;
  recorded_at: string;
};

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
      <h1 className="text-2xl font-semibold mb-6">{t('title')}</h1>

      <div className="flex flex-wrap gap-3 mb-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">{t('filterCrop')}</label>
          <select
            value={cropFilter}
            onChange={(e) => setCropFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-green-500"
          >
            <option value="">{t('allCrops')}</option>
            {crops.map((crop) => (
              <option key={crop} value={crop}>{translateCrop(crop, locale)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">{t('filterMarket')}</label>
          <select
            value={marketFilter}
            onChange={(e) => setMarketFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-green-500"
          >
            <option value="">{t('allMarkets')}</option>
            {markets.map((market) => (
              <option key={market} value={market}>{market}</option>
            ))}
          </select>
        </div>
      </div>

      {hasError && <p className="text-sm text-red-600 mb-4">{errorRaw || tc('error')}</p>}

      {cropFilter && (
        <div className="mb-4">
          <PriceTrendChart
            prices={prices.filter((p) => p.crop_type === cropFilter)}
            cropType={cropFilter}
          />
        </div>
      )}

      <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 border-b border-gray-200">
              <th className="px-4 py-3 font-medium">{t('market')}</th>
              <th className="px-4 py-3 font-medium">{t('crop')}</th>
              <th className="px-4 py-3 font-medium">{t('price')}</th>
              <th className="px-4 py-3 font-medium">{t('date')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-gray-100 animate-pulse">
                  {[...Array(4)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded w-24" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  {t('empty')}
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.price_id} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-4 py-3">{p.market_name}</td>
                  <td className="px-4 py-3">{translateCrop(p.crop_type, locale)}</td>
                  <td className="px-4 py-3">
                    {Number(p.price_rwf).toLocaleString(locale)}/{p.unit}
                  </td>
                  <td className="px-4 py-3">
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
