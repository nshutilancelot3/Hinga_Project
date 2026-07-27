'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { apiPost, getApiError, isLoggedIn } from '@/lib/api';
import { translateDisease } from '@/lib/diseases';

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

type DiagnosisResult = {
  disease_name: string;
  confidence: number;
  treatment: string;
  is_healthy: boolean | null;
};

function UploadIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1F6B3A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 16V4M12 4 7 9M12 4l5 5" />
      <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// The backend stores Plant.id's treatment object as a JSON string. Each
// category (chemical, biological, ...) holds several tips; render them as a
// bullet list per category instead of one long comma-joined line.
function parseTreatment(treatment: string): Array<[string, string[]]> | null {
  try {
    const parsed = JSON.parse(treatment);
    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed).filter(
        (entry): entry is [string, string[]] => Array.isArray(entry[1]) && entry[1].length > 0
      );
    }
  } catch {
    // not JSON
  }
  return null;
}

export default function DiagnosisPage() {
  const t = useTranslations('diagnosis');
  const router = useRouter();
  const locale = useLocale();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropType, setCropType] = useState('');
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [errorKey, setErrorKey] = useState<'noFile' | 'tooLarge' | 'notAPlant' | 'generic' | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  function acceptFile(selected: File) {
    if (selected.size > MAX_SIZE_BYTES) {
      setErrorKey('tooLarge');
      return;
    }

    setErrorKey(null);
    setResult(null);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) acceptFile(selected);
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) acceptFile(dropped);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isLoggedIn()) {
      router.push('/login');
      return;
    }
    if (!file) {
      setErrorKey('noFile');
      return;
    }

    setErrorKey(null);
    setResult(null);
    setLoading(true);

    try {
      const image = await fileToDataUrl(file);
      const data = await apiPost('/diagnosis', { image, crop_type: cropType });
      setResult(data);
    } catch (err) {
      const { code } = getApiError(err);
      setErrorKey(code === 'NOT_A_PLANT' ? 'notAPlant' : 'generic');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold text-hinga-ink mb-6 text-center">{t('title')}</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-hinga-inkMuted mb-1">{t('cropType')}</label>
          <input
            type="text"
            required
            value={cropType}
            onChange={(e) => setCropType(e.target.value)}
            className="w-full border border-hinga-green/20 rounded-lg px-3 py-2 text-sm transition-colors focus:outline-none focus:border-hinga-green"
          />
        </div>

        <label
          htmlFor="photo"
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer flex flex-col items-center gap-3 transition-all duration-200 ${
            dragActive
              ? 'border-hinga-green bg-hinga-green/5 scale-[1.02]'
              : 'border-hinga-green/25 hover:border-hinga-green/50 hover:bg-hinga-green/[0.03]'
          }`}
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="max-h-48 rounded-lg object-cover shadow-sm" />
          ) : (
            <>
              <UploadIcon />
              <span className="text-sm text-hinga-inkMuted">{t('dragDrop')}</span>
            </>
          )}
          <span className="text-sm font-medium text-hinga-green">{t('upload')}</span>
          <input
            id="photo"
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {errorKey && <p className="text-sm text-red-600">{t(`errors.${errorKey}`)}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-hinga-green text-white rounded-lg py-2 text-sm font-medium transition-colors hover:bg-hinga-greenDark disabled:opacity-60"
        >
          {loading ? t('loading') : t('diagnoseButton')}
        </button>
      </form>

      {result && (
        <div className="rise-in bg-white border border-hinga-green/10 shadow-sm rounded-xl p-6 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-hinga-ink">{t('result')}</h2>
            {result.is_healthy !== null && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  result.is_healthy
                    ? 'bg-hinga-green/10 text-hinga-green'
                    : 'bg-hinga-terracotta/10 text-hinga-terracotta'
                }`}
              >
                {result.is_healthy ? t('healthy') : t('diseased')}
              </span>
            )}
          </div>

          <p className="font-medium text-hinga-ink mb-2">{translateDisease(result.disease_name, locale)}</p>

          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-hinga-inkMuted mb-1">
              <span>{t('confidence')}</span>
              <span className="font-medium tabular-nums">{Math.round(result.confidence * 100)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-hinga-green/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-hinga-green transition-all duration-700 ease-out"
                style={{ width: `${Math.round(result.confidence * 100)}%` }}
              />
            </div>
          </div>

          {(() => {
            const categories = parseTreatment(result.treatment);
            if (!categories) {
              return <p className="text-sm text-hinga-inkMuted">{result.treatment}</p>;
            }
            return (
              <div className="flex flex-col gap-3">
                {categories.map(([category, tips]) => (
                  <div key={category}>
                    <p className="text-xs font-semibold text-hinga-ink uppercase tracking-wide mb-1">
                      {t.has(`treatmentCategories.${category}`) ? t(`treatmentCategories.${category}`) : category}
                    </p>
                    <ul className="list-disc list-outside pl-4 flex flex-col gap-1">
                      {tips.map((tip, i) => (
                        <li key={i} className="text-sm text-hinga-inkMuted">{tip}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      <p className="text-xs text-hinga-inkMuted mt-4">{t('disclaimer')}</p>
    </div>
  );
}
