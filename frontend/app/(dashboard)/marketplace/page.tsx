'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { apiDelete, apiGet, apiPost, getCurrentUser, getRawError, isLoggedIn } from '@/lib/api';
import { DISTRICTS } from '@/lib/districts';
import { translateCrop } from '@/lib/crops';

type Listing = {
  listing_id: string;
  farmer_id: string;
  crop_type: string;
  quantity_kg: string;
  price_per_kg: string;
  district: string;
  description: string | null;
  farmer: { full_name: string };
};

function CropIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F6B3A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3C14.5 5.5 15.5 4.5 17.5 6.5C19.5 8.5 18 10 20 12C22 14 20 15 19.5 17C19 19 17 18 15.5 19.5C14 21 13 19.5 12 21C11 19.5 10 21 8.5 19.5C7 18 5 19 4.5 17C4 15 2 14 4 12C6 10 4.5 8.5 6.5 6.5C8.5 4.5 9.5 5.5 12 3Z" />
      <path d="M12 6C10.5 9 13.5 11 12 14C10.5 17 13.5 18.5 12 21" />
    </svg>
  );
}

const inputClass =
  'w-full border border-hinga-green/20 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-hinga-green';

export default function MarketplacePage() {
  const t = useTranslations('marketplace');
  const tc = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorRaw, setErrorRaw] = useState('');
  const [hasError, setHasError] = useState(false);
  const [cropFilter, setCropFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');

  const [showPostForm, setShowPostForm] = useState(false);
  const [postCrop, setPostCrop] = useState('');
  const [postDistrict, setPostDistrict] = useState(DISTRICTS[0]);
  const [postQuantity, setPostQuantity] = useState('');
  const [postPrice, setPostPrice] = useState('');
  const [postDescription, setPostDescription] = useState('');
  const [postErrorRaw, setPostErrorRaw] = useState('');
  const [postHasError, setPostHasError] = useState(false);
  const [postLoading, setPostLoading] = useState(false);

  const [openEnquiryId, setOpenEnquiryId] = useState<string | null>(null);
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [enquiryErrorRaw, setEnquiryErrorRaw] = useState('');
  const [enquiryHasError, setEnquiryHasError] = useState(false);
  const [enquiryLoading, setEnquiryLoading] = useState(false);
  const [sentEnquiryIds, setSentEnquiryIds] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteErrorId, setDeleteErrorId] = useState<string | null>(null);

  const user = getCurrentUser();
  const canPost = !user || user.role === 'farmer';
  const canEnquire = !user || user.role === 'buyer';

  function loadListings() {
    setLoading(true);
    apiGet('/listings')
      .then(setListings)
      .catch((err) => {
        setErrorRaw(getRawError(err));
        setHasError(true);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const crops = useMemo(
    () => Array.from(new Set(listings.map((l) => l.crop_type))).sort(),
    [listings]
  );

  const rows = listings.filter(
    (l) =>
      (!cropFilter || l.crop_type === cropFilter) &&
      (!districtFilter || l.district === districtFilter)
  );

  function openPostForm() {
    if (!isLoggedIn()) {
      router.push('/login');
      return;
    }
    setShowPostForm(true);
  }

  async function handlePostSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPostHasError(false);
    setPostLoading(true);

    try {
      await apiPost('/listings', {
        crop_type: postCrop,
        district: postDistrict,
        quantity_kg: postQuantity,
        price_per_kg: postPrice,
        ...(postDescription && { description: postDescription }),
      });
      setShowPostForm(false);
      setPostCrop('');
      setPostQuantity('');
      setPostPrice('');
      setPostDescription('');
      loadListings();
    } catch (err) {
      setPostErrorRaw(getRawError(err));
      setPostHasError(true);
    } finally {
      setPostLoading(false);
    }
  }

  function openEnquiryBox(listingId: string) {
    if (!isLoggedIn()) {
      router.push('/login');
      return;
    }
    setOpenEnquiryId(listingId);
    setEnquiryMessage('');
    setEnquiryHasError(false);
  }

  async function handleEnquirySubmit(e: React.FormEvent, listingId: string) {
    e.preventDefault();
    setEnquiryHasError(false);
    setEnquiryLoading(true);

    try {
      await apiPost('/enquiries', { listing_id: listingId, message: enquiryMessage });
      setSentEnquiryIds((ids) => [...ids, listingId]);
      setOpenEnquiryId(null);
    } catch (err) {
      setEnquiryErrorRaw(getRawError(err));
      setEnquiryHasError(true);
    } finally {
      setEnquiryLoading(false);
    }
  }

  async function handleDelete(listingId: string) {
    if (!window.confirm(t('confirmDeleteListing'))) return;

    setDeleteErrorId(null);
    setDeletingId(listingId);
    try {
      await apiDelete(`/listings/${listingId}`);
      setListings((current) => current.filter((l) => l.listing_id !== listingId));
    } catch {
      setDeleteErrorId(listingId);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-hinga-ink">{t('title')}</h1>
        {canPost && (
          <button
            onClick={openPostForm}
            className="px-4 py-2 bg-hinga-green text-white rounded-lg text-sm font-medium hover:bg-hinga-greenDark"
          >
            {t('postListing')}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div>
          <label className="block text-sm text-hinga-inkMuted mb-1">{t('filterCrop')}</label>
          <select
            value={cropFilter}
            onChange={(e) => setCropFilter(e.target.value)}
            className={inputClass}
          >
            <option value="">{t('allCrops')}</option>
            {crops.map((crop) => (
              <option key={crop} value={crop}>{translateCrop(crop, locale)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-hinga-inkMuted mb-1">{t('filterDistrict')}</label>
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className={inputClass}
          >
            <option value="">{t('allDistricts')}</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {hasError && <p className="text-sm text-red-600 mb-4">{errorRaw || tc('error')}</p>}

      {showPostForm && (
        <form
          onSubmit={handlePostSubmit}
          className="bg-white border border-hinga-green/10 rounded-xl p-6 mb-6 flex flex-col gap-4 max-w-md"
        >
          <div>
            <label className="block text-sm text-hinga-inkMuted mb-1">{t('crop')}</label>
            <input
              type="text"
              required
              value={postCrop}
              onChange={(e) => setPostCrop(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-hinga-inkMuted mb-1">{t('district')}</label>
            <select
              value={postDistrict}
              onChange={(e) => setPostDistrict(e.target.value)}
              className={inputClass}
            >
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-hinga-inkMuted mb-1">{t('quantity')}</label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={postQuantity}
              onChange={(e) => setPostQuantity(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-hinga-inkMuted mb-1">{t('pricePerKg')}</label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={postPrice}
              onChange={(e) => setPostPrice(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-hinga-inkMuted mb-1">{t('description')}</label>
            <textarea
              value={postDescription}
              onChange={(e) => setPostDescription(e.target.value)}
              rows={3}
              className={inputClass}
            />
          </div>
          {postHasError && <p className="text-sm text-red-600">{postErrorRaw || tc('error')}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={postLoading}
              className="px-4 py-2 bg-hinga-green text-white rounded-lg text-sm font-medium hover:bg-hinga-greenDark disabled:opacity-60"
            >
              {postLoading ? tc('loading') : t('submit')}
            </button>
            <button
              type="button"
              onClick={() => setShowPostForm(false)}
              className="px-4 py-2 border border-hinga-green/20 rounded-lg text-sm text-hinga-inkMuted hover:bg-hinga-green/5"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-hinga-inkMuted">{t('loading')}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-hinga-inkMuted">{t('empty')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((l) => (
            <div
              key={l.listing_id}
              className="group bg-white border border-hinga-green/10 rounded-xl p-4 transition-all duration-200 hover:border-hinga-green/25 hover:shadow-lg hover:shadow-hinga-green/5 hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full bg-hinga-green/10 -rotate-12 transition-transform duration-300 group-hover:rotate-0">
                  <CropIcon />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-hinga-ink tracking-tight truncate">{translateCrop(l.crop_type, locale)}</p>
                  <p className="text-xs text-hinga-inkMuted">{l.district}</p>
                </div>
              </div>

              <div className="flex items-baseline justify-between mb-3">
                <p className="text-3xl font-extrabold text-hinga-green tracking-tight tabular-nums">
                  {Number(l.price_per_kg).toLocaleString(locale)}
                  <span className="text-sm font-normal text-hinga-inkMuted ml-1">RWF/kg</span>
                </p>
                <p className="px-2 py-0.5 rounded-full bg-hinga-green/5 text-xs font-medium text-hinga-inkMuted whitespace-nowrap">
                  {Number(l.quantity_kg).toLocaleString(locale)} kg
                </p>
              </div>

              <p className="text-xs text-hinga-inkMuted mb-2">
                {t('farmer')}: <span className="font-medium text-hinga-ink">{l.farmer.full_name}</span>
              </p>
              {l.description && (
                <p className="text-sm text-hinga-inkMuted italic mb-2">
                  <span className="text-hinga-terracotta not-italic mr-0.5">&ldquo;</span>
                  {l.description}
                  <span className="text-hinga-terracotta not-italic ml-0.5">&rdquo;</span>
                </p>
              )}

              {user?.user_id === l.farmer_id && (
                <div className="mb-2">
                  <button
                    onClick={() => handleDelete(l.listing_id)}
                    disabled={deletingId === l.listing_id}
                    className="px-3 py-1 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-60"
                  >
                    {deletingId === l.listing_id ? tc('loading') : tc('delete')}
                  </button>
                  {deleteErrorId === l.listing_id && (
                    <p className="text-sm text-red-600 mt-1">{t('deleteError')}</p>
                  )}
                </div>
              )}

              {canEnquire && (
                <>
                  {sentEnquiryIds.includes(l.listing_id) ? (
                    <p className="text-sm text-hinga-green font-medium">{t('enquirySent')}</p>
                  ) : openEnquiryId === l.listing_id ? (
                    <form
                      onSubmit={(e) => handleEnquirySubmit(e, l.listing_id)}
                      className="flex flex-col gap-2 mt-2"
                    >
                      <textarea
                        required
                        value={enquiryMessage}
                        onChange={(e) => setEnquiryMessage(e.target.value)}
                        rows={2}
                        placeholder={t('message')}
                        className={inputClass}
                      />
                      {enquiryHasError && <p className="text-sm text-red-600">{enquiryErrorRaw || tc('error')}</p>}
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={enquiryLoading}
                          className="px-3 py-1 bg-hinga-green text-white rounded-lg text-sm font-medium hover:bg-hinga-greenDark disabled:opacity-60"
                        >
                          {enquiryLoading ? tc('loading') : t('submit')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpenEnquiryId(null)}
                          className="px-3 py-1 border border-hinga-green/20 rounded-lg text-sm text-hinga-inkMuted hover:bg-hinga-green/5"
                        >
                          {t('cancel')}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => openEnquiryBox(l.listing_id)}
                      className="px-3 py-1 border border-hinga-green text-hinga-green rounded-lg text-sm font-medium hover:bg-hinga-green/5"
                    >
                      {t('sendEnquiry')}
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
