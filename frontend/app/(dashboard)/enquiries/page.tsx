'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { apiGet, apiPut, getCurrentUser, getRawError, isLoggedIn } from '@/lib/api';
import { translateCrop } from '@/lib/crops';
import { formatLongDate } from '@/lib/dateFormat';

type Enquiry = {
  enquiry_id: string;
  message: string;
  created_at: string;
  status: 'pending' | 'resolved';
  buyer: { full_name: string; email: string };
  listing: { listing_id: string; crop_type: string; district: string };
};

export default function EnquiriesPage() {
  const t = useTranslations('enquiries');
  const tm = useTranslations('marketplace');
  const tc = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();

  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorRaw, setErrorRaw] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  async function markResolved(enquiryId: string) {
    setResolvingId(enquiryId);
    try {
      await apiPut(`/enquiries/${enquiryId}`, { status: 'resolved' });
      setEnquiries((prev) =>
        prev.map((e) => (e.enquiry_id === enquiryId ? { ...e, status: 'resolved' } : e))
      );
    } catch (err) {
      setErrorRaw(getRawError(err));
    } finally {
      setResolvingId(null);
    }
  }

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/login');
      return;
    }
    // Only farmers receive enquiries; send anyone else back to the marketplace.
    const user = getCurrentUser();
    if (user?.role !== 'farmer') {
      router.push('/marketplace');
      return;
    }

    apiGet('/enquiries/received')
      .then((data) => setEnquiries(data))
      .catch((err) => setErrorRaw(getRawError(err)))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-hinga-ink mb-6">{t('title')}</h1>

      {loading && <p className="text-sm text-hinga-inkMuted">{t('loading')}</p>}

      {!loading && errorRaw && <p className="text-sm text-red-600">{errorRaw || tc('error')}</p>}

      {!loading && !errorRaw && enquiries.length === 0 && (
        <p className="text-sm text-hinga-inkMuted">{t('empty')}</p>
      )}

      <ul className="flex flex-col gap-4">
        {enquiries.map((e) => (
          <li
            key={e.enquiry_id}
            className="bg-white border border-hinga-green/10 shadow-sm rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-hinga-green">
                {t('onListing', {
                  crop: translateCrop(e.listing.crop_type, locale),
                  district: e.listing.district,
                })}
              </span>
              <span className="text-xs text-hinga-inkMuted">
                {formatLongDate(new Date(e.created_at), locale)}
              </span>
            </div>
            <p className="text-sm text-hinga-ink mb-1">{e.message}</p>
            <p className="text-xs text-hinga-inkMuted mb-2">
              {t('from', { name: e.buyer.full_name })} · {e.buyer.email}
            </p>
            {e.status === 'resolved' ? (
              <span className="text-sm text-hinga-green font-medium">{tm('responded')}</span>
            ) : (
              <button
                onClick={() => markResolved(e.enquiry_id)}
                disabled={resolvingId === e.enquiry_id}
                className="text-sm text-hinga-green font-medium hover:underline disabled:opacity-60"
              >
                {resolvingId === e.enquiry_id ? tc('loading') : tm('markResponded')}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
