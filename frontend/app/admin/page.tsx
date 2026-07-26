'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ConfirmDialog from '@/components/ConfirmDialog';
import { apiGet, apiPost, apiPut, apiDelete, getCurrentUser, getRawError } from '@/lib/api';
import { translateCrop } from '@/lib/crops';

const MARKETS = ['Kimironko', 'Nyabugogo', 'Musanze', 'Huye', 'Rubavu'];
const ROLES = ['farmer', 'buyer', 'coop_admin', 'super_admin'];

type MarketPrice = {
  price_id: string;
  market_name: string;
  crop_type: string;
  price_rwf: string;
  unit: string;
  recorded_at: string;
};

type AdminUser = {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  district: string;
};

export default function AdminPage() {
  const t = useTranslations('admin');
  const tr = useTranslations('auth.roles');
  const tc = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [errorRaw, setErrorRaw] = useState('');

  // Price form state
  const [editId, setEditId] = useState<string | null>(null);
  const [market, setMarket] = useState(MARKETS[0]);
  const [crop, setCrop] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('kg');
  const [saving, setSaving] = useState(false);

  const [confirmTarget, setConfirmTarget] = useState<{ type: 'price' | 'user'; id: string } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Redirect anyone who is not an admin straight to home.
  useEffect(() => {
    const user = getCurrentUser();
    if (!user || (user.role !== 'coop_admin' && user.role !== 'super_admin')) {
      router.replace('/');
      return;
    }
    setRole(user.role);
    setReady(true);
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    apiGet('/prices').then(setPrices).catch((err) => setErrorRaw(getRawError(err)));
    if (role === 'super_admin') {
      apiGet('/admin/users')
        .then((data) => setUsers(data.users))
        .catch((err) => setErrorRaw(getRawError(err)));
    }
  }, [ready, role]);

  const sortedPrices = useMemo(
    () => [...prices].sort((a, b) => b.recorded_at.localeCompare(a.recorded_at)),
    [prices]
  );

  function resetForm() {
    setEditId(null);
    setMarket(MARKETS[0]);
    setCrop('');
    setPrice('');
    setUnit('kg');
  }

  function startEdit(p: MarketPrice) {
    setEditId(p.price_id);
    setMarket(p.market_name);
    setCrop(p.crop_type);
    setPrice(String(p.price_rwf));
    setUnit(p.unit);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorRaw('');
    try {
      const body = { market_name: market, crop_type: crop, price_rwf: Number(price), unit };
      if (editId) {
        await apiPut(`/prices/${editId}`, body);
      } else {
        await apiPost('/prices', body);
      }
      const refreshed = await apiGet('/prices');
      setPrices(refreshed);
      resetForm();
    } catch (err) {
      setErrorRaw(getRawError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePrice(id: string) {
    setConfirmLoading(true);
    try {
      await apiDelete(`/prices/${id}`);
      setPrices((prev) => prev.filter((p) => p.price_id !== id));
      setConfirmTarget(null);
    } catch (err) {
      setErrorRaw(getRawError(err));
    } finally {
      setConfirmLoading(false);
    }
  }

  async function handleRoleChange(id: string, newRole: string) {
    try {
      const updated = await apiPut(`/admin/users/${id}/role`, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.user_id === id ? { ...u, role: updated.role } : u)));
    } catch (err) {
      setErrorRaw(getRawError(err));
    }
  }

  async function handleDeleteUser(id: string) {
    setConfirmLoading(true);
    try {
      await apiDelete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.user_id !== id));
      setConfirmTarget(null);
    } catch (err) {
      setErrorRaw(getRawError(err));
    } finally {
      setConfirmLoading(false);
    }
  }

  function handleConfirmDelete() {
    if (!confirmTarget) return;
    if (confirmTarget.type === 'price') handleDeletePrice(confirmTarget.id);
    else handleDeleteUser(confirmTarget.id);
  }

  if (!ready) return null;

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-semibold mb-6">{t('title')}</h1>

        {errorRaw && <p className="text-sm text-red-600 mb-4">{errorRaw || tc('error')}</p>}

        {/* Price management — both coop_admin and super_admin */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-4">{t('pricesHeading')}</h2>

          <form
            onSubmit={handleSubmit}
            className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t('market')}</label>
              <select
                value={market}
                onChange={(e) => setMarket(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {MARKETS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t('crop')}</label>
              <input
                type="text"
                required
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t('price')}</label>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t('unit')}</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-3 sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-800 disabled:opacity-60"
              >
                {saving ? t('saving') : editId ? t('updatePrice') : t('addPrice')}
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-sm text-gray-600 hover:text-green-700"
                >
                  {t('cancelEdit')}
                </button>
              )}
            </div>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-lg">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-2">{t('market')}</th>
                  <th className="px-4 py-2">{t('crop')}</th>
                  <th className="px-4 py-2">{t('price')}</th>
                  <th className="px-4 py-2">{t('unit')}</th>
                  <th className="px-4 py-2">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedPrices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-400">{t('noPrices')}</td>
                  </tr>
                ) : (
                  sortedPrices.map((p) => (
                    <tr key={p.price_id} className="border-t border-gray-100">
                      <td className="px-4 py-2">{p.market_name}</td>
                      <td className="px-4 py-2">{translateCrop(p.crop_type, locale)}</td>
                      <td className="px-4 py-2">{Number(p.price_rwf).toLocaleString()}</td>
                      <td className="px-4 py-2">{p.unit}</td>
                      <td className="px-4 py-2 flex gap-3">
                        <button onClick={() => startEdit(p)} className="text-green-700 hover:underline">
                          {tc('edit')}
                        </button>
                        <button onClick={() => setConfirmTarget({ type: 'price', id: p.price_id })} className="text-red-600 hover:underline">
                          {tc('delete')}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* User management — super_admin only */}
        {role === 'super_admin' && (
          <section>
            <h2 className="text-lg font-semibold mb-4">{t('usersHeading')}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-lg">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="px-4 py-2">{t('name')}</th>
                    <th className="px-4 py-2">{t('email')}</th>
                    <th className="px-4 py-2">{t('role')}</th>
                    <th className="px-4 py-2">{t('district')}</th>
                    <th className="px-4 py-2">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-gray-400">{t('noUsers')}</td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.user_id} className="border-t border-gray-100">
                        <td className="px-4 py-2">{u.full_name}</td>
                        <td className="px-4 py-2">{u.email}</td>
                        <td className="px-4 py-2">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.user_id, e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>{tr(r)}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2">{u.district}</td>
                        <td className="px-4 py-2">
                          <button onClick={() => setConfirmTarget({ type: 'user', id: u.user_id })} className="text-red-600 hover:underline">
                            {tc('delete')}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      <ConfirmDialog
        open={confirmTarget !== null}
        message={confirmTarget?.type === 'user' ? t('confirmDeleteUser') : t('confirmDeletePrice')}
        loading={confirmLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </>
  );
}
