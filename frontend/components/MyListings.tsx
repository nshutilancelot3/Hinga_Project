'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { apiDelete, apiGet, apiPut, getRawError } from '@/lib/api';
import { translateCrop } from '@/lib/crops';
import { translateDescription } from '@/lib/descriptions';
import ConfirmDialog from '@/components/ConfirmDialog';

type OwnListing = {
  listing_id: string;
  crop_type: string;
  quantity_kg: string;
  price_per_kg: string;
  district: string;
  description: string | null;
  status: 'active' | 'sold' | 'cancelled';
};

type Enquiry = {
  enquiry_id: string;
  message: string;
  created_at: string;
  buyer: { full_name: string };
};

const inputClass =
  'w-full border border-hinga-green/20 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-hinga-green';

const STATUS_STYLES: Record<OwnListing['status'], string> = {
  active: 'bg-hinga-green/10 text-hinga-green',
  sold: 'bg-hinga-terracotta/10 text-hinga-terracotta',
  cancelled: 'bg-gray-200 text-gray-600',
};

export default function MyListings({ onChange }: { onChange?: () => void }) {
  const t = useTranslations('marketplace');
  const tc = useTranslations('common');
  const locale = useLocale();

  const [listings, setListings] = useState<OwnListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorRaw, setErrorRaw] = useState('');
  const [hasError, setHasError] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<OwnListing['status']>('active');
  const [editErrorRaw, setEditErrorRaw] = useState('');
  const [editHasError, setEditHasError] = useState(false);
  const [saving, setSaving] = useState(false);

  const [openEnquiriesId, setOpenEnquiriesId] = useState<string | null>(null);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [enquiriesLoading, setEnquiriesLoading] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function loadMine() {
    setLoading(true);
    apiGet('/listings/mine')
      .then(setListings)
      .catch((err) => {
        setErrorRaw(getRawError(err));
        setHasError(true);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadMine();
  }, []);

  function startEdit(l: OwnListing) {
    setEditId(l.listing_id);
    setEditQuantity(l.quantity_kg);
    setEditPrice(l.price_per_kg);
    setEditDescription(l.description ?? '');
    setEditStatus(l.status);
    setEditHasError(false);
  }

  function cancelEdit() {
    setEditId(null);
  }

  async function handleEditSubmit(e: React.FormEvent, listingId: string) {
    e.preventDefault();
    setEditHasError(false);
    setSaving(true);
    try {
      await apiPut(`/listings/${listingId}`, {
        quantity_kg: editQuantity,
        price_per_kg: editPrice,
        ...(editDescription && { description: editDescription }),
        status: editStatus,
      });
      setEditId(null);
      loadMine();
      onChange?.();
    } catch (err) {
      setEditErrorRaw(getRawError(err));
      setEditHasError(true);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    const listingId = confirmDeleteId;
    if (!listingId) return;

    setDeletingId(listingId);
    try {
      await apiDelete(`/listings/${listingId}`);
      setListings((prev) => prev.filter((l) => l.listing_id !== listingId));
      onChange?.();
    } catch (err) {
      setErrorRaw(getRawError(err) || t('deleteError'));
      setHasError(true);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  function toggleEnquiries(listingId: string) {
    if (openEnquiriesId === listingId) {
      setOpenEnquiriesId(null);
      return;
    }
    setOpenEnquiriesId(listingId);
    setEnquiriesLoading(true);
    apiGet(`/enquiries?listing_id=${listingId}`)
      .then(setEnquiries)
      .catch((err) => {
        setErrorRaw(getRawError(err));
        setHasError(true);
      })
      .finally(() => setEnquiriesLoading(false));
  }

  if (loading) return <p className="text-sm text-hinga-inkMuted">{t('loading')}</p>;

  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-hinga-ink mb-4">{t('myListingsTitle')}</h2>

      {hasError && <p className="text-sm text-red-600 mb-4">{errorRaw || tc('error')}</p>}

      {listings.length === 0 ? (
        <p className="text-sm text-hinga-inkMuted">{t('empty')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((l) => (
            <div
              key={l.listing_id}
              className="bg-white border border-hinga-green/10 rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-lg font-bold text-hinga-ink tracking-tight">
                  {translateCrop(l.crop_type, locale)}
                </p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[l.status]}`}>
                  {t(`status${l.status.charAt(0).toUpperCase()}${l.status.slice(1)}` as 'statusActive' | 'statusSold' | 'statusCancelled')}
                </span>
              </div>
              <p className="text-xs text-hinga-inkMuted mb-2">{l.district}</p>

              {editId === l.listing_id ? (
                <form onSubmit={(e) => handleEditSubmit(e, l.listing_id)} className="flex flex-col gap-2">
                  <div>
                    <label className="block text-xs text-hinga-inkMuted mb-1">{t('quantity')}</label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={editQuantity}
                      onChange={(e) => setEditQuantity(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-hinga-inkMuted mb-1">{t('pricePerKg')}</label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-hinga-inkMuted mb-1">{t('description')}</label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={2}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-hinga-inkMuted mb-1">{t('status')}</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as OwnListing['status'])}
                      className={inputClass}
                    >
                      <option value="active">{t('statusActive')}</option>
                      <option value="sold">{t('statusSold')}</option>
                      <option value="cancelled">{t('statusCancelled')}</option>
                    </select>
                  </div>
                  {editHasError && <p className="text-sm text-red-600">{editErrorRaw || tc('error')}</p>}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-3 py-1 bg-hinga-green text-white rounded-lg text-sm font-medium hover:bg-hinga-greenDark disabled:opacity-60"
                    >
                      {saving ? tc('loading') : t('saveChanges')}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-3 py-1 border border-hinga-green/20 rounded-lg text-sm text-hinga-inkMuted hover:bg-hinga-green/5"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-baseline justify-between mb-3">
                    <p className="text-2xl font-extrabold text-hinga-green tracking-tight tabular-nums">
                      {Number(l.price_per_kg).toLocaleString(locale)}
                      <span className="text-sm font-normal text-hinga-inkMuted ml-1">RWF/kg</span>
                    </p>
                    <p className="px-2 py-0.5 rounded-full bg-hinga-green/5 text-xs font-medium text-hinga-inkMuted whitespace-nowrap">
                      {Number(l.quantity_kg).toLocaleString(locale)} kg
                    </p>
                  </div>
                  {l.description && (
                    <p className="text-sm text-hinga-inkMuted italic mb-3">
                      <span className="text-hinga-terracotta not-italic mr-0.5">&ldquo;</span>
                      {translateDescription(l.description, locale)}
                      <span className="text-hinga-terracotta not-italic ml-0.5">&rdquo;</span>
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-2">
                    <button
                      onClick={() => startEdit(l)}
                      className="px-3 py-1 border border-hinga-green text-hinga-green rounded-lg text-sm font-medium hover:bg-hinga-green/5"
                    >
                      {tc('edit')}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(l.listing_id)}
                      disabled={deletingId === l.listing_id}
                      className="px-3 py-1 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-60"
                    >
                      {deletingId === l.listing_id ? tc('loading') : tc('delete')}
                    </button>
                    <button
                      onClick={() => toggleEnquiries(l.listing_id)}
                      className="px-3 py-1 border border-hinga-green/20 text-hinga-inkMuted rounded-lg text-sm font-medium hover:bg-hinga-green/5"
                    >
                      {openEnquiriesId === l.listing_id ? t('hideEnquiries') : t('viewEnquiries')}
                    </button>
                  </div>

                  {openEnquiriesId === l.listing_id && (
                    <div className="mt-2 border-t border-hinga-green/10 pt-2">
                      {enquiriesLoading ? (
                        <p className="text-xs text-hinga-inkMuted">{t('loading')}</p>
                      ) : enquiries.length === 0 ? (
                        <p className="text-xs text-hinga-inkMuted">{t('noEnquiries')}</p>
                      ) : (
                        <ul className="flex flex-col gap-2">
                          {enquiries.map((enq) => (
                            <li key={enq.enquiry_id} className="text-xs text-hinga-ink">
                              <span className="font-medium">{enq.buyer.full_name}</span>
                              <span className="text-hinga-inkMuted">: {enq.message}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmDeleteId !== null}
        message={t('confirmDeleteListing')}
        loading={deletingId !== null}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </section>
  );
}
