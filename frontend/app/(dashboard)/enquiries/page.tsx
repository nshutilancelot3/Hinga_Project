'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { apiGet, getCurrentUser, getRawError, isLoggedIn } from '@/lib/api';
import { translateCrop } from '@/lib/crops';
import { formatLongDate } from '@/lib/dateFormat';

type Enquiry = {
  enquiry_id: string;
  message: string;
  created_at: string;
  buyer: { full_name: string };
  listing: { listing_id: string; crop_type: string; district: string };
};

export default function EnquiriesPage() {
  const t = useTranslations('enquiries');
  const tc = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();

  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorRaw, setErrorRaw] = useState('');

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
            <p className="text-xs text-hinga-inkMuted">
              {t('from', { name: e.buyer.full_name })}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
