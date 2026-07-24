'use client';

import { useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { translateCrop } from '@/lib/crops';

// Fixed categorical order (validated for CVD separation) so a market's color
// never changes when a filter changes which markets are visible.
const SERIES_COLORS = ['#2a78d6', '#1baf7a', '#eda100', '#008300', '#4a3aa7', '#e34948', '#e87ba4', '#eb6834'];

type PricePoint = {
  market_name: string;
  price_rwf: string;
  recorded_at: string;
};

type Props = {
  prices: PricePoint[];
  cropType: string;
};

const WIDTH = 640;
const HEIGHT = 260;
const PAD_LEFT = 68;
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 44;

export default function PriceTrendChart({ prices, cropType }: Props) {
  const t = useTranslations('prices');
  const locale = useLocale();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const markets = useMemo(
    () => Array.from(new Set(prices.map((p) => p.market_name))).sort(),
    [prices]
  );

  const dates = useMemo(
    () => Array.from(new Set(prices.map((p) => p.recorded_at.slice(0, 10)))).sort(),
    [prices]
  );

  const series = useMemo(() => {
    return markets.map((market) => {
      const byDate = new Map<string, number>();
      prices
        .filter((p) => p.market_name === market)
        .forEach((p) => byDate.set(p.recorded_at.slice(0, 10), Number(p.price_rwf)));
      return {
        market,
        points: dates.map((d) => byDate.get(d) ?? null),
      };
    });
  }, [markets, dates, prices]);

  const allValues = prices.map((p) => Number(p.price_rwf));
  const maxValue = allValues.length ? Math.max(...allValues) : 0;
  const minValue = allValues.length ? Math.min(...allValues) : 0;
  const yMax = maxValue === minValue ? maxValue + 1 : maxValue;
  const yMin = maxValue === minValue ? Math.max(0, minValue - 1) : minValue;

  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  function xFor(i: number) {
    if (dates.length <= 1) return PAD_LEFT + plotWidth / 2;
    return PAD_LEFT + (i / (dates.length - 1)) * plotWidth;
  }
  function yFor(value: number) {
    const ratio = (value - yMin) / (yMax - yMin || 1);
    return PAD_TOP + plotHeight - ratio * plotHeight;
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!svgRef.current || dates.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const ratio = Math.min(1, Math.max(0, (relX - PAD_LEFT) / plotWidth));
    const idx = Math.round(ratio * (dates.length - 1));
    setHoverIndex(Math.min(dates.length - 1, Math.max(0, idx)));
  }

  if (dates.length < 2) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-500">
        {t('trendNeedsData')}
      </div>
    );
  }

  const yTicks = 4;
  const tickValues = Array.from({ length: yTicks + 1 }, (_, i) => yMin + ((yMax - yMin) * i) / yTicks);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-sm font-medium text-gray-900 mb-1">
        {t('trendTitle', { crop: translateCrop(cropType, locale) })}
      </p>
      <div className="overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-auto"
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoverIndex(null)}
        >
          {tickValues.map((v, i) => (
            <g key={i}>
              <line
                x1={PAD_LEFT}
                x2={WIDTH - PAD_RIGHT}
                y1={yFor(v)}
                y2={yFor(v)}
                stroke="#e1e0d9"
                strokeWidth={1}
              />
              <text x={PAD_LEFT - 8} y={yFor(v)} textAnchor="end" dominantBaseline="middle" className="fill-gray-400" fontSize={10}>
                {Math.round(v).toLocaleString(locale)}
              </text>
            </g>
          ))}

          <text
            x={14}
            y={PAD_TOP + plotHeight / 2}
            textAnchor="middle"
            className="fill-gray-500"
            fontSize={10}
            fontWeight={500}
            transform={`rotate(-90, 14, ${PAD_TOP + plotHeight / 2})`}
          >
            {t('price')}
          </text>

          <text x={PAD_LEFT} y={HEIGHT - 20} textAnchor="start" className="fill-gray-400" fontSize={10}>
            {dates[0]}
          </text>
          <text x={WIDTH - PAD_RIGHT} y={HEIGHT - 20} textAnchor="end" className="fill-gray-400" fontSize={10}>
            {dates[dates.length - 1]}
          </text>
          <text
            x={PAD_LEFT + plotWidth / 2}
            y={HEIGHT - 6}
            textAnchor="middle"
            className="fill-gray-500"
            fontSize={10}
            fontWeight={500}
          >
            {t('date')}
          </text>

          {hoverIndex !== null && (
            <line
              x1={xFor(hoverIndex)}
              x2={xFor(hoverIndex)}
              y1={PAD_TOP}
              y2={PAD_TOP + plotHeight}
              stroke="#c3c2b7"
              strokeWidth={1}
            />
          )}

          {series.map((s, si) => {
            const color = SERIES_COLORS[si % SERIES_COLORS.length];
            const segments = s.points
              .map((v, i) => (v === null ? null : `${xFor(i)},${yFor(v)}`))
              .filter((p): p is string => p !== null);
            return (
              <g key={s.market}>
                {segments.length > 1 && (
                  <polyline points={segments.join(' ')} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                )}
                {s.points.map((v, i) =>
                  v === null ? null : (
                    <circle key={i} cx={xFor(i)} cy={yFor(v)} r={4} fill={color} stroke="#fff" strokeWidth={2} />
                  )
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        {markets.map((market, i) => (
          <div key={market} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="inline-block w-3 h-0.5 rounded-full" style={{ backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length] }} />
            {market}
          </div>
        ))}
      </div>

      {hoverIndex !== null && (
        <div className="mt-3 border-t border-gray-100 pt-2 text-xs text-gray-600">
          <p className="text-gray-900 font-medium mb-1">{dates[hoverIndex]}</p>
          {series.map((s, i) => {
            const v = s.points[hoverIndex];
            if (v === null) return null;
            return (
              <div key={s.market} className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length] }} />
                <span>{s.market}:</span>
                <span className="font-medium text-gray-900">{Math.round(v).toLocaleString(locale)} RWF</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
