'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { translateCrop } from '@/lib/crops';

const BAR_COLOR = '#1F6B3A';

type PricePoint = {
  crop_type: string;
  price_rwf: string;
  market_name: string;
};

type Props = {
  prices: PricePoint[];
  onSelectCrop: (crop: string) => void;
};

const WIDTH = 640;
const HEIGHT = 260;
const PAD_LEFT = 68;
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 44;

export default function MarketOverviewChart({ prices, onSelectCrop }: Props) {
  const t = useTranslations('prices');
  const locale = useLocale();
  const [hoverCrop, setHoverCrop] = useState<string | null>(null);

  const bars = useMemo(() => {
    const byCrop = new Map<string, number[]>();
    for (const p of prices) {
      const list = byCrop.get(p.crop_type) ?? [];
      list.push(Number(p.price_rwf));
      byCrop.set(p.crop_type, list);
    }
    return Array.from(byCrop.entries())
      .map(([crop, values]) => ({
        crop,
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        count: values.length,
      }))
      .sort((a, b) => a.avg - b.avg);
  }, [prices]);

  if (bars.length === 0) return null;

  const maxValue = Math.max(...bars.map((b) => b.avg));
  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const slot = plotWidth / bars.length;
  const barWidth = Math.min(24, slot * 0.6);

  function yFor(value: number) {
    return PAD_TOP + plotHeight - (value / (maxValue || 1)) * plotHeight;
  }

  const yTicks = 4;
  const tickValues = Array.from({ length: yTicks + 1 }, (_, i) => (maxValue * i) / yTicks);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-sm font-medium text-gray-900 mb-1">{t('overviewTitle')}</p>
      <p className="text-xs text-gray-500 mb-3">{t('overviewSubtitle')}</p>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto">
          {tickValues.map((v, i) => (
            <g key={i}>
              <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={yFor(v)} y2={yFor(v)} stroke="#e1e0d9" strokeWidth={1} />
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

          {bars.map((b, i) => {
            const cx = PAD_LEFT + slot * i + slot / 2;
            const barTop = yFor(b.avg);
            const barHeight = PAD_TOP + plotHeight - barTop;
            const isHovered = hoverCrop === b.crop;
            return (
              <g
                key={b.crop}
                onPointerEnter={() => setHoverCrop(b.crop)}
                onPointerLeave={() => setHoverCrop(null)}
                onClick={() => onSelectCrop(b.crop)}
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
                  y={HEIGHT - PAD_BOTTOM + 16}
                  textAnchor="middle"
                  className="fill-gray-500"
                  fontSize={10}
                >
                  {translateCrop(b.crop, locale).slice(0, 10)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {hoverCrop && (
        <div className="mt-2 text-xs text-gray-600 border-t border-gray-100 pt-2">
          {(() => {
            const b = bars.find((x) => x.crop === hoverCrop)!;
            return (
              <p>
                <span className="font-medium text-gray-900">{translateCrop(b.crop, locale)}</span>
                {': '}
                {Math.round(b.avg).toLocaleString(locale)} RWF/kg
                {' · '}
                {t('overviewMarketCount', { count: b.count })}
              </p>
            );
          })()}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-2">{t('overviewHint')}</p>
    </div>
  );
}
