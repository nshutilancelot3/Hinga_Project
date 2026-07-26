'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { translateCrop } from '@/lib/crops';

const BAR_COLOR = '#1F6B3A';

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

export default function PriceByMarketChart({ prices, cropType }: Props) {
  const t = useTranslations('prices');
  const locale = useLocale();
  const [hoverMarket, setHoverMarket] = useState<string | null>(null);

  const bars = useMemo(() => {
    const latestByMarket = new Map<string, { price: number; date: string }>();
    for (const p of prices) {
      const existing = latestByMarket.get(p.market_name);
      if (!existing || p.recorded_at > existing.date) {
        latestByMarket.set(p.market_name, { price: Number(p.price_rwf), date: p.recorded_at });
      }
    }
    return Array.from(latestByMarket.entries())
      .map(([market, { price }]) => ({ market, price }))
      .sort((a, b) => a.price - b.price);
  }, [prices]);

  if (bars.length === 0) return null;

  const maxValue = Math.max(...bars.map((b) => b.price));
  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const slot = plotWidth / bars.length;
  const barWidth = Math.min(48, slot * 0.6);

  function yFor(value: number) {
    return PAD_TOP + plotHeight - (value / (maxValue || 1)) * plotHeight;
  }

  const yTicks = 4;
  const tickValues = Array.from({ length: yTicks + 1 }, (_, i) => (maxValue * i) / yTicks);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-base font-semibold text-gray-900 mb-2">
        {t('byMarketTitle', { crop: translateCrop(cropType, locale) })}
      </p>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto">
          {tickValues.map((v, i) => (
            <g key={i}>
              <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={yFor(v)} y2={yFor(v)} stroke="#e1e0d9" strokeWidth={1} />
              <text x={PAD_LEFT - 8} y={yFor(v)} textAnchor="end" dominantBaseline="middle" className="fill-gray-500" fontSize={12}>
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

          {bars.map((b, i) => {
            const cx = PAD_LEFT + slot * i + slot / 2;
            const barTop = yFor(b.price);
            const barHeight = PAD_TOP + plotHeight - barTop;
            const isHovered = hoverMarket === b.market;
            return (
              <g
                key={b.market}
                onPointerEnter={() => setHoverMarket(b.market)}
                onPointerLeave={() => setHoverMarket(null)}
                className="cursor-pointer"
              >
                <rect x={cx - slot / 2} y={PAD_TOP} width={slot} height={plotHeight} fill="transparent" />
                <rect
                  x={cx - barWidth / 2}
                  y={barTop}
                  width={barWidth}
                  height={Math.max(barHeight, 2)}
                  rx={4}
                  fill={BAR_COLOR}
                  opacity={isHovered ? 1 : 0.85}
                />
                <text
                  x={cx}
                  y={barTop - 8}
                  textAnchor="middle"
                  className="fill-gray-800"
                  fontSize={12}
                  fontWeight={600}
                >
                  {Math.round(b.price).toLocaleString(locale)}
                </text>
                <text
                  x={cx}
                  y={HEIGHT - PAD_BOTTOM + 16}
                  textAnchor="middle"
                  className="fill-gray-500"
                  fontSize={11}
                >
                  {b.market}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {hoverMarket && (
        <div className="mt-2 text-xs text-gray-600 border-t border-gray-100 pt-2">
          {(() => {
            const b = bars.find((x) => x.market === hoverMarket)!;
            return (
              <p>
                <span className="font-medium text-gray-900">{b.market}</span>
                {': '}
                {Math.round(b.price).toLocaleString(locale)} RWF/kg
              </p>
            );
          })()}
        </div>
      )}
    </div>
  );
}
