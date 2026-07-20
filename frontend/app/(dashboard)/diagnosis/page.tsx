'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { apiUpload, getRawError, isLoggedIn } from '@/lib/api';

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

type DiagnosisResult = {
  disease_name: string;
  confidence: number;
  treatment: string;
};

export default function DiagnosisPage() {
  const t = useTranslations('diagnosis');
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [errorKey, setErrorKey] = useState<'noFile' | 'tooLarge' | 'generic' | null>(null);
  const [errorRaw, setErrorRaw] = useState('');
  const [loading, setLoading] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > MAX_SIZE_BYTES) {
      setErrorKey('tooLarge');
      return;
    }

    setErrorKey(null);
    setResult(null);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
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
      const formData = new FormData();
      formData.append('photo', file);
      const data = await apiUpload('/diagnose', formData);
      setResult(data);
    } catch (err) {
      setErrorRaw(getRawError(err));
      setErrorKey('generic');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">{t('title')}</h1>

      <form onSubmit={handleSubmit} className="max-w-md flex flex-col gap-4">
        <label
          htmlFor="photo"
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-green-500 flex flex-col items-center gap-3"
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="max-h-48 rounded-lg object-cover" />
          ) : (
            <span className="text-sm text-gray-500">{t('dragDrop')}</span>
          )}
          <span className="text-sm text-gray-600">{t('upload')}</span>
          <input
            id="photo"
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {errorKey && (
          <p className="text-sm text-red-600">
            {errorKey === 'generic' && errorRaw ? errorRaw : t(`errors.${errorKey}`)}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-green-700 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-800 disabled:opacity-60"
        >
          {loading ? t('loading') : t('diagnoseButton')}
        </button>
      </form>

      {result && (
        <div className="max-w-md bg-white border border-gray-200 rounded-xl p-6 mt-6">
          <h2 className="text-lg font-semibold mb-3">{t('result')}</h2>
          <p className="font-medium text-gray-900">{result.disease_name}</p>
          <p className="text-sm text-gray-500 mb-3">
            {t('confidence')}: {Math.round(result.confidence * 100)}%
          </p>
          <p className="text-sm text-gray-700">{result.treatment}</p>
        </div>
      )}

      <p className="max-w-md text-xs text-gray-500 mt-4">{t('disclaimer')}</p>
    </div>
  );
}
