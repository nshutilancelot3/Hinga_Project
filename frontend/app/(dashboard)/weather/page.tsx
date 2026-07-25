'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { apiGet, getRawError } from '@/lib/api';
import { DISTRICTS } from '@/lib/districts';
import { translateCondition } from '@/lib/weatherConditions';

type ForecastSlot = {
  dt: number;
  dt_txt: string;
  main: { temp: number; feels_like: number; humidity: number };
  weather: { description: string; icon: string }[];
  wind: { speed: number };
  pop?: number;
};

type WeatherResponse = {
  district: string;
  fetched_at: string;
  forecast: { list: ForecastSlot[] };
};

type Day = {
  key: string;
  slots: ForecastSlot[];
  min: number;
  max: number;
  lead: ForecastSlot;
  pop: number;
};

// OpenWeatherMap's icon PNGs are dated and cost one request each. Their codes map
// to nine conditions, so we draw them instead: sharper, and nothing to download.
// `animate` is reserved for the large hero icon — the tiny row icons stay still so
// a full week of them never turns into visual noise.
function WeatherIcon({
  code = '',
  className = '',
  animate = false,
}: {
  code?: string;
  className?: string;
  animate?: boolean;
}) {
  const kind = code.slice(0, 2);
  const night = code.endsWith('n');

  const cloud = (
    <path
      d="M7 18h9.5a3.5 3.5 0 0 0 .3-7A5 5 0 0 0 7.6 9.4 4.3 4.3 0 0 0 7 18Z"
      className="fill-stone-100 stroke-stone-400"
    />
  );

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {kind === '01' &&
        (night ? (
          <path
            d="M18 14.5A7 7 0 0 1 9.5 6a7 7 0 1 0 8.5 8.5Z"
            className="fill-stone-200 stroke-stone-500"
          />
        ) : (
          <g className="stroke-amber-500">
            <circle cx="12" cy="12" r="4.2" className="fill-amber-200" />
            <path
              className={animate ? 'wx-spin' : undefined}
              d="M12 3.2v1.6M12 19.2v1.6M3.2 12h1.6M19.2 12h1.6M5.8 5.8l1.1 1.1M17.1 17.1l1.1 1.1M18.2 5.8l-1.1 1.1M6.9 17.1l-1.1 1.1"
            />
          </g>
        ))}

      {(kind === '02' || kind === '03' || kind === '04') && (
        <g>
          {kind === '02' &&
            (night ? (
              <path
                d="M15.5 8.2A4.4 4.4 0 0 1 11 3.8a4.4 4.4 0 1 0 4.5 4.4Z"
                className="fill-stone-200 stroke-stone-500"
              />
            ) : (
              <circle cx="9" cy="8" r="3" className="fill-amber-200 stroke-amber-500" />
            ))}
          {cloud}
        </g>
      )}

      {(kind === '09' || kind === '10') && (
        <g>
          {cloud}
          <g className={`stroke-sky-500 ${animate ? 'wx-rain' : ''}`}>
            <path d="M9.5 20.2l-.7 1.6M13 20.2l-.7 1.6M16.5 20.2l-.7 1.6" />
          </g>
        </g>
      )}

      {kind === '11' && (
        <g>
          {cloud}
          <path d="M13.2 19.6l-3 2.6h2.6l-1.2 1.7" className="stroke-amber-500" />
        </g>
      )}

      {kind === '13' && (
        <g>
          {cloud}
          <g className={`stroke-sky-400 ${animate ? 'wx-rain' : ''}`} strokeWidth={2.2}>
            <path d="M10 21h.01M13 21.6h.01M16 21h.01" />
          </g>
        </g>
      )}

      {kind === '50' && (
        <g className="stroke-stone-400">
          <path d="M4 9h16M6 13h13M4 17h11" />
        </g>
      )}
    </svg>
  );
}

// The hero wears the sky. Each condition + time of day gets a hand-tuned gradient
// (all CSS — same "nothing to download" rule as the icons), layered under a bottom
// scrim so the white readout stays legible even over the paler skies (snow, mist).
// Rain and night skies read darker on purpose: the weather you'd want to plan around.
function skyGradient(code = '') {
  const kind = code.slice(0, 2);
  const night = code.endsWith('n');
  // Two scrims keep the white readout legible over any sky: a floor along the
  // bottom, and a pool under the bottom-right where the detail grid lands on wide
  // screens (the palest corner of a daytime gradient).
  const scrim =
    'linear-gradient(to top, rgba(15,21,31,0.5), rgba(15,21,31,0.08) 54%, transparent 72%), ' +
    'radial-gradient(85% 120% at 100% 100%, rgba(13,19,29,0.42), transparent 58%)';
  const sun = 'radial-gradient(120% 90% at 82% 6%, rgba(255,238,196,0.55), transparent 46%)';
  const moon = 'radial-gradient(70% 60% at 80% 12%, rgba(210,224,255,0.35), transparent 45%)';

  const base = (() => {
    switch (kind) {
      case '01':
        return night
          ? `${moon}, linear-gradient(160deg, #0e1738 0%, #223057 62%, #364670 100%)`
          : `${sun}, linear-gradient(160deg, #1a548f 0%, #3f80c2 62%, #649cce 100%)`;
      case '02':
      case '03':
        return night
          ? `${moon}, linear-gradient(162deg, #171f2c 0%, #2e3a4c 66%, #414e5e 100%)`
          : `${sun}, linear-gradient(160deg, #356491 0%, #5e88ad 66%, #85a4bd 100%)`;
      case '04':
        return night
          ? `linear-gradient(162deg, #1a212a 0%, #2f3843 68%, #424c57 100%)`
          : `linear-gradient(160deg, #4e5c67 0%, #71808d 66%, #8b98a3 100%)`;
      case '09':
      case '10':
        return night
          ? `linear-gradient(163deg, #0f151d 0%, #202b37 66%, #2f3c49 100%)`
          : `linear-gradient(160deg, #263845 0%, #38505f 60%, #4a6675 100%)`;
      case '11':
        return `linear-gradient(160deg, #241f33 0%, #3d3652 64%, #514a67 100%)`;
      case '13':
        return `linear-gradient(160deg, #5c7080 0%, #7f93a2 64%, #a4b3be 100%)`;
      case '50':
        return `linear-gradient(160deg, #626c76 0%, #838a92 64%, #a0a7ad 100%)`;
      default:
        return `linear-gradient(160deg, #356491 0%, #5e88ad 66%, #85a4bd 100%)`;
    }
  })();

  return `${scrim}, ${base}`;
}

// Tint the range bar by conditions, not temperature — the bar's position already
// carries the temp range. Rain pulls it toward sky blue, sun toward warm amber,
// and an overcast-but-dry day stays muted stone. Rain wins when both are present,
// since a farmer needs the wet-day warning more than the sunny-day nicety.
function barColor(pop: number, code = '') {
  const p = Math.max(0, Math.min(1, pop));
  const kind = code.slice(0, 2);
  // 01 clear, 02 few clouds, 03 scattered, 04 overcast; rest carry no sun.
  const sun = kind === '01' ? 1 : kind === '02' ? 0.6 : kind === '03' ? 0.25 : kind === '04' ? 0.1 : 0;

  const dry = [214, 211, 209]; // stone-300 — cloudy and dry
  const warm = [245, 200, 66]; // amber — sunny
  const wet = [2, 132, 199]; // sky-600 — rainy
  const c = dry.map((d, i) => Math.round(d + (warm[i] - d) * sun * (1 - p) + (wet[i] - d) * p));
  return `rgb(${c[0]} ${c[1]} ${c[2]})`;
}

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

  const days: Day[] = useMemo(() => {
    if (!data) return [];
    const buckets = data.forecast.list.reduce<Record<string, ForecastSlot[]>>((acc, slot) => {
      (acc[slot.dt_txt.slice(0, 10)] ??= []).push(slot);
      return acc;
    }, {});

    return Object.entries(buckets).map(([key, slots]) => {
      const temps = slots.map((s) => s.main.temp);
      // The midday slot represents a day better than an average of all eight.
      const lead = slots.reduce((best, s) =>
        Math.abs(Number(s.dt_txt.slice(11, 13)) - 12) <
        Math.abs(Number(best.dt_txt.slice(11, 13)) - 12)
          ? s
          : best
      );
      return {
        key,
        slots,
        min: Math.min(...temps),
        max: Math.max(...temps),
        lead,
        pop: Math.max(...slots.map((s) => s.pop ?? 0)),
      };
    });
  }, [data]);

  // One shared scale, so the range bars are comparable down the week.
  const scale = useMemo(() => {
    if (!days.length) return { lo: 0, hi: 1 };
    return {
      lo: Math.min(...days.map((d) => d.min)),
      hi: Math.max(...days.map((d) => d.max)),
    };
  }, [days]);

  const span = Math.max(scale.hi - scale.lo, 1);
  const today = days[0];

  const clock = (slot: ForecastSlot) =>
    new Date(slot.dt * 1000).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="text-stone-800">
      <header className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-green-800/70">{t('title')}</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <h1 className="text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
            {data ? data.district : t('selectDistrict')}
          </h1>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            aria-label={t('selectDistrict')}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 shadow-sm transition-colors hover:border-stone-400 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20"
          >
            <option value="">{t('selectDistrict')}</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </header>

      {hasError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorRaw || tc('error')}
        </p>
      )}

      {!district && !hasError && !loading && (
        <p className="max-w-sm border-l-2 border-green-700/30 py-1 pl-4 text-sm leading-relaxed text-stone-500">
          {t('empty')}
        </p>
      )}

      {loading && (
        <div aria-live="polite" className="space-y-3">
          <span className="sr-only">{t('loading')}</span>
          <div className="h-52 animate-pulse rounded-3xl bg-stone-100" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-stone-100" />
          ))}
        </div>
      )}

      {today && (
        <section
          className="wx-rise relative mb-8 overflow-hidden rounded-3xl p-6 text-white shadow-xl shadow-stone-900/10 ring-1 ring-inset ring-white/10 sm:p-8"
          style={{
            background: skyGradient(today.lead.weather[0]?.icon),
            textShadow: '0 1px 3px rgba(12,18,28,0.28)',
          }}
        >
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-8">
            <div className="flex items-center gap-4 sm:gap-5">
              <WeatherIcon
                code={today.lead.weather[0]?.icon}
                animate
                className="wx-float h-24 w-24 shrink-0 drop-shadow-md sm:h-28 sm:w-28"
              />
              <div>
                <p className="text-7xl font-light leading-none tracking-tighter tabular-nums drop-shadow-sm sm:text-8xl">
                  {Math.round(today.lead.main.temp)}°
                </p>
                <p className="mt-2.5 text-base capitalize text-white/90">
                  {today.lead.weather[0]?.description
                    ? translateCondition(today.lead.weather[0].description, locale)
                    : ''}
                </p>
              </div>
            </div>

            <dl className="grid shrink-0 grid-cols-2 gap-x-8 gap-y-3 text-sm sm:gap-x-12">
              {[
                [t('feelsLike'), `${Math.round(today.lead.main.feels_like)}°`],
                [t('rain'), `${Math.round(today.pop * 100)}%`],
                [t('humidity'), `${today.lead.main.humidity}%`],
                [t('wind'), `${today.lead.wind.speed} m/s`],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-4">
                  <dt className="text-white/70">{label}</dt>
                  <dd className="font-semibold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {days.length > 0 && (
        <div className="mb-1 flex items-center justify-between gap-4 border-b border-stone-200 pb-2">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-stone-500">
            {t('forecast')}
          </h2>
          <div className="flex items-center gap-2 text-stone-400">
            <WeatherIcon code="01d" className="h-4 w-4" />
            <span
              className="h-1.5 w-24 rounded-full"
              style={{
                background:
                  'linear-gradient(to right, rgb(245 200 66), rgb(214 211 209), rgb(2 132 199))',
              }}
            />
            <WeatherIcon code="10d" className="h-4 w-4" />
          </div>
        </div>
      )}

      {days.map((day, i) => {
        const left = ((day.min - scale.lo) / span) * 100;
        const right = ((day.max - scale.lo) / span) * 100;

        return (
          <details
            key={day.key}
            open={i === 0}
            style={{ animationDelay: `${Math.min(i, 6) * 55}ms` }}
            className="wx-rise border-b border-stone-200/80 last:border-b-0"
          >
            <summary className="flex cursor-pointer list-none items-center gap-3 py-3.5 transition-colors hover:bg-stone-50/80 [&::-webkit-details-marker]:hidden">
              <span className="w-[4.5rem] shrink-0 text-sm font-medium text-stone-700">
                {new Date(`${day.key}T00:00:00`).toLocaleDateString(locale, { weekday: 'short' })}
              </span>

              <WeatherIcon code={day.lead.weather[0]?.icon} className="h-6 w-6 shrink-0" />

              <span className="w-9 shrink-0 text-right text-xs tabular-nums text-sky-700">
                {day.pop >= 0.1 ? `${Math.round(day.pop * 100)}%` : ''}
              </span>

              <div className="relative mx-1 h-1.5 min-w-0 flex-1 rounded-full bg-stone-200/80">
                <div
                  className="absolute inset-y-0 rounded-full"
                  style={{
                    left: `${left}%`,
                    right: `${100 - right}%`,
                    backgroundColor: barColor(day.pop, day.lead.weather[0]?.icon),
                  }}
                />
              </div>

              <span className="w-[4.2rem] shrink-0 text-right text-sm tabular-nums">
                <span className="sr-only">{t('high')} </span>
                <span className="font-medium text-stone-900">{Math.round(day.max)}°</span>{' '}
                <span className="sr-only">{t('low')} </span>
                <span className="text-stone-400">{Math.round(day.min)}°</span>
              </span>
            </summary>

            <div className="-mx-1 overflow-x-auto px-1 pb-5 pt-1">
              <div className="flex min-w-max gap-6">
                {day.slots.map((slot) => (
                  <div key={slot.dt} className="w-12 text-center">
                    <p className="text-[11px] tabular-nums text-stone-400">{clock(slot)}</p>
                    <WeatherIcon code={slot.weather[0]?.icon} className="mx-auto my-1.5 h-8 w-8" />
                    <p className="text-sm font-medium tabular-nums text-stone-900">
                      {Math.round(slot.main.temp)}°
                    </p>
                    <p className="h-4 text-[11px] tabular-nums text-sky-600">
                      {(slot.pop ?? 0) >= 0.1 ? `${Math.round((slot.pop ?? 0) * 100)}%` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </details>
        );
      })}
    </div>
  );
}
