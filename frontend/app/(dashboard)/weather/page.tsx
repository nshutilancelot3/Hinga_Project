'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { apiGet, getRawError } from '@/lib/api';
import { DISTRICTS } from '@/lib/districts';

type ForecastSlot = {
  dt: number;
  dt_txt: string;
  main: { temp: number; feels_like: number; humidity: number };
  weather: { description: string; icon: string }[];
  wind: { speed: number };
};

type WeatherResponse = {
  district: string;
  fetched_at: string;
  forecast: { list: ForecastSlot[] };
};

export default function WeatherPage() {
  const t = useTranslations('weather');
  const tc = useTranslations('common');
  const locale = useLocale();

  const [district, setDistrict] = useState('');
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorRaw, setErrorRaw] = useState('');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!district) return;
    setLoading(true);
    setHasError(false);
    setData(null);
    apiGet(`/weather/${district.toLowerCase()}`)
      .then(setData)
      .catch((err) => {
        setErrorRaw(getRawError(err));
        setHasError(true);
      })
      .finally(() => setLoading(false));
  }, [district]);

  const days = data
    ? Object.entries(
        data.forecast.list.reduce<Record<string, ForecastSlot[]>>((acc, slot) => {
          const day = slot.dt_txt.slice(0, 10);
          (acc[day] ??= []).push(slot);
          return acc;
        }, {})
      )
    : [];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">{t('title')}</h1>

      <div className="mb-6">
        <label className="block text-sm text-gray-600 mb-1">{t('selectDistrict')}</label>
        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-green-500"
        >
          <option value="">{t('selectDistrict')}</option>
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {loading && <p className="text-sm text-gray-500 mb-4">{t('loading')}</p>}
      {hasError && <p className="text-sm text-red-600 mb-4">{errorRaw || tc('error')}</p>}

      {days.map(([day, slots]) => (
        <section key={day} className="mb-6">
          <h2 className="text-sm font-medium text-gray-600 mb-2">
            {new Date(`${day}T00:00:00`).toLocaleDateString(locale, {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {slots.map((slot) => (
              <div
                key={slot.dt}
                className="bg-white border border-gray-200 rounded-xl p-3 text-center"
              >
                <p className="text-xs text-gray-500">
                  {new Date(slot.dt * 1000).toLocaleTimeString(locale, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <img
                  src={`https://openweathermap.org/img/wn/${slot.weather[0]?.icon}@2x.png`}
                  alt={slot.weather[0]?.description ?? ''}
                  className="w-12 h-12 mx-auto"
                />
                <p className="text-lg font-semibold">{Math.round(slot.main.temp)}°C</p>
                <p className="text-xs text-gray-500 capitalize mb-2">
                  {slot.weather[0]?.description}
                </p>
                <p className="text-xs text-gray-500">
                  {t('feelsLike')}: {Math.round(slot.main.feels_like)}°C
                </p>
                <p className="text-xs text-gray-500">
                  {t('humidity')}: {slot.main.humidity}%
                </p>
                <p className="text-xs text-gray-500">
                  {t('wind')}: {slot.wind.speed} m/s
                </p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
