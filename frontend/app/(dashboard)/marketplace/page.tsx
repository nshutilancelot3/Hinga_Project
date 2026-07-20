'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost, getCurrentUser, getRawError, isLoggedIn } from '@/lib/api';
import { DISTRICTS } from '@/lib/districts';

type Listing = {
  listing_id: string;
  crop_type: string;
  quantity_kg: string;
  price_per_kg: string;
  district: string;
  description: string | null;
  farmer: { full_name: string };
};

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
      await apiPost(`/listings/${listingId}/enquiries`, { message: enquiryMessage });
      setSentEnquiryIds((ids) => [...ids, listingId]);
      setOpenEnquiryId(null);
    } catch (err) {
      setEnquiryErrorRaw(getRawError(err));
      setEnquiryHasError(true);
    } finally {
      setEnquiryLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        {canPost && (
          <button
            onClick={openPostForm}
            className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800"
          >
            {t('postListing')}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">{t('filterCrop')}</label>
          <select
            value={cropFilter}
            onChange={(e) => setCropFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-green-500"
          >
            <option value="">{t('allCrops')}</option>
            {crops.map((crop) => (
              <option key={crop} value={crop}>{crop}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">{t('filterDistrict')}</label>
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-green-500"
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
          className="bg-white border border-gray-200 rounded-xl p-6 mb-6 flex flex-col gap-4 max-w-md"
        >
          <div>
            <label className="block text-sm text-gray-600 mb-1">{t('crop')}</label>
            <input
              type="text"
              required
              value={postCrop}
              onChange={(e) => setPostCrop(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">{t('district')}</label>
            <select
              value={postDistrict}
              onChange={(e) => setPostDistrict(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
            >
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">{t('quantity')}</label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={postQuantity}
              onChange={(e) => setPostQuantity(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">{t('pricePerKg')}</label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={postPrice}
              onChange={(e) => setPostPrice(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">{t('description')}</label>
            <textarea
              value={postDescription}
              onChange={(e) => setPostDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
            />
          </div>
          {postHasError && <p className="text-sm text-red-600">{postErrorRaw || tc('error')}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={postLoading}
              className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-60"
            >
              {postLoading ? tc('loading') : t('submit')}
            </button>
            <button
              type="button"
              onClick={() => setShowPostForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">{t('loading')}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-500">{t('empty')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((l) => (
            <div key={l.listing_id} className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="font-medium text-gray-900">{l.crop_type}</p>
              <p className="text-sm text-gray-500 mt-1">
                {t('quantity')}: {Number(l.quantity_kg).toLocaleString(locale)} kg
              </p>
              <p className="text-sm text-gray-500">
                {t('pricePerKg')}: {Number(l.price_per_kg).toLocaleString(locale)} RWF
              </p>
              <p className="text-sm text-gray-500">{l.district}</p>
              <p className="text-sm text-gray-500 mb-2">
                {t('farmer')}: {l.farmer.full_name}
              </p>
              {l.description && <p className="text-sm text-gray-600 mb-2">{l.description}</p>}

              {canEnquire && (
                <>
                  {sentEnquiryIds.includes(l.listing_id) ? (
                    <p className="text-sm text-green-700">{t('enquirySent')}</p>
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
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                      />
                      {enquiryHasError && <p className="text-sm text-red-600">{enquiryErrorRaw || tc('error')}</p>}
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={enquiryLoading}
                          className="px-3 py-1 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-60"
                        >
                          {enquiryLoading ? tc('loading') : t('submit')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpenEnquiryId(null)}
                          className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                        >
                          {t('cancel')}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => openEnquiryBox(l.listing_id)}
                      className="px-3 py-1 border border-green-700 text-green-700 rounded-lg text-sm font-medium hover:bg-green-50"
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
