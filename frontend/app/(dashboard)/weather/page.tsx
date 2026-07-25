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

  // Slightly cool-white cloud with a defined outline: reads as white over the dark
  // sky hero, yet still stands out against the pale forecast list.
  const cloud = (
    <path
      d="M7 18h9.5a3.5 3.5 0 0 0 .3-7A5 5 0 0 0 7.6 9.4 4.3 4.3 0 0 0 7 18Z"
      className="fill-slate-50 stroke-slate-400"
    />
  );

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {kind === '01' &&
        (night ? (
          <path
            d="M18 14.5A7 7 0 0 1 9.5 6a7 7 0 1 0 8.5 8.5Z"
            className="fill-slate-200 stroke-slate-400"
          />
        ) : (
          <g className="stroke-amber-500">
            <circle cx="12" cy="12" r="4.4" className="fill-amber-300" />
            <path
              className={animate ? 'wx-spin' : undefined}
              strokeWidth={2}
              d="M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.4 5.4l1.4 1.4M17.2 17.2l1.4 1.4M18.6 5.4l-1.4 1.4M6.8 17.2l-1.4 1.4"
            />
          </g>
        ))}

      {(kind === '02' || kind === '03' || kind === '04') && (
        <g>
          {kind !== '04' &&
            (night ? (
              <path
                d="M15.5 8.2A4.4 4.4 0 0 1 11 3.8a4.4 4.4 0 1 0 4.5 4.4Z"
                className="fill-slate-200 stroke-slate-400"
              />
            ) : (
              <circle cx="9" cy="7.6" r="3.2" className="fill-amber-300 stroke-amber-500" />
            ))}
          {cloud}
        </g>
      )}

      {(kind === '09' || kind === '10') && (
        <g>
          {cloud}
          <g className={`stroke-blue-500 ${animate ? 'wx-rain' : ''}`} strokeWidth={2.1}>
            <path d="M9.3 20l-.8 1.9M12.9 20l-.8 1.9M16.5 20l-.8 1.9" />
          </g>
        </g>
      )}

      {kind === '11' && (
        <g>
          {cloud}
          <path
            d="M13.2 19.4l-3 2.8h2.7l-1.3 1.8"
            className="fill-amber-400 stroke-amber-500"
            strokeWidth={1.4}
          />
        </g>
      )}

      {kind === '13' && (
        <g>
          {cloud}
          <g className={`stroke-sky-400 ${animate ? 'wx-rain' : ''}`} strokeWidth={2.4}>
            <path d="M10 21h.01M13 21.6h.01M16 21h.01" />
          </g>
        </g>
      )}

      {kind === '50' && (
        <g className="stroke-slate-400">
          <path d="M4 9h16M6 13h13M4 17h11" />
        </g>
      )}
    </svg>
  );
}

// Small glyphs for the farmer advisory. currentColor lets the caller tint them.
function DropIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11Z"
        fill="currentColor"
        fillOpacity={0.35}
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SproutIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 21v-8" />
      <path d="M12 13c0-3.2 2.2-5.3 5.5-5.3 0 3.2-2.2 5.3-5.5 5.3Z" fill="currentColor" fillOpacity={0.3} />
      <path d="M12 14.5c0-2.8-2-4.8-5-4.8 0 2.8 2 4.8 5 4.8Z" fill="currentColor" fillOpacity={0.3} />
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
  const sun = 'radial-gradient(125% 95% at 84% 2%, rgba(255,222,130,0.7), transparent 48%)';
  const moon = 'radial-gradient(70% 60% at 80% 12%, rgba(210,224,255,0.35), transparent 45%)';

  const base = (() => {
    switch (kind) {
      case '01':
        return night
          ? `${moon}, linear-gradient(160deg, #0d1a44 0%, #23306a 60%, #3a4f8f 100%)`
          : `${sun}, linear-gradient(158deg, #0c62b8 0%, #2189db 58%, #52a8e6 100%)`;
      case '02':
      case '03':
        return night
          ? `${moon}, linear-gradient(162deg, #171f2c 0%, #2e3a4c 66%, #414e5e 100%)`
          : `${sun}, linear-gradient(158deg, #2273b6 0%, #4d98cd 64%, #79b7de 100%)`;
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

  const dry = [203, 213, 225]; // slate-300 — cloudy and dry
  const warm = [250, 189, 47]; // vivid gold — sunny
  const wet = [14, 116, 205]; // vivid blue — rainy
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

  // Rain is what a farmer plans around, so it drives one plain-language cue:
  // a meaningful chance of rain (>=40%) flips the advice from "good to work" to
  // "plan around the rain". The forecast page shows the numbers; this reads them.
  const rainToday = today ? Math.round(today.pop * 100) : 0;
  const wetDay = today ? today.pop >= 0.4 : false;

  const clock = (slot: ForecastSlot) =>
    new Date(slot.dt * 1000).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="text-stone-800">
      {/* Soft sky-to-field wash so the page never reads as flat white. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-sky-50 via-white to-lime-50/50"
      />

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
          <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-6">
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

            <div className="flex flex-col gap-4 sm:items-end">
              <div className="flex items-center gap-2.5">
                <DropIcon className="h-6 w-6 text-sky-200" />
                <span className="text-sm text-white/75">{t('rain')}</span>
                <span className="text-3xl font-bold tabular-nums leading-none">{rainToday}%</span>
              </div>
              <dl className="flex gap-x-8 text-sm">
                {[
                  [t('humidity'), `${today.lead.main.humidity}%`],
                  [t('wind'), `${today.lead.wind.speed} m/s`],
                ].map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-0.5 sm:items-end">
                    <dt className="text-white/70">{label}</dt>
                    <dd className="text-base font-semibold tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-3 ring-1 ring-inset ring-white/15">
            {wetDay ? (
              <DropIcon className="h-5 w-5 shrink-0 text-sky-100" />
            ) : (
              <SproutIcon className="h-5 w-5 shrink-0 text-lime-200" />
            )}
            <p className="text-sm font-medium leading-snug">
              {wetDay ? t('advisoryWet') : t('advisoryDry')}
            </p>
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
                  'linear-gradient(to right, rgb(250 189 47), rgb(203 213 225), rgb(14 116 205))',
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
            className="wx-rise border-b border-stone-200/70 last:border-b-0"
          >
            <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl px-2 py-3.5 transition-colors hover:bg-white/70 [&::-webkit-details-marker]:hidden">
              <span className="w-16 shrink-0 text-sm font-semibold text-stone-700">
                {new Date(`${day.key}T00:00:00`).toLocaleDateString(locale, { weekday: 'short' })}
              </span>

              <WeatherIcon code={day.lead.weather[0]?.icon} className="h-7 w-7 shrink-0" />

              <span
                className={`flex w-11 shrink-0 items-center justify-end gap-0.5 text-right text-xs font-semibold tabular-nums ${
                  day.pop >= 0.4 ? 'text-blue-600' : 'text-sky-600/70'
                }`}
              >
                {day.pop >= 0.1 && (
                  <>
                    <DropIcon className="h-3 w-3" />
                    {Math.round(day.pop * 100)}%
                  </>
                )}
              </span>

              <div className="relative mx-1 h-2 min-w-0 flex-1 rounded-full bg-stone-200/70">
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
