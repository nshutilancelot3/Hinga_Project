'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';

const DISTRICTS = [
  'Bugesera','Burera','Gakenke','Gasabo','Gatsibo','Gicumbi','Gisagara',
  'Huye','Kamonyi','Karongi','Kayonza','Kicukiro','Kirehe','Muhanga',
  'Musanze','Ngabo','Ngoma','Ngororero','Nyabihu','Nyagatare','Nyamagabe',
  'Nyamasheke','Nyanza','Nyarugenge','Nyaruguru','Rubavu','Ruhango',
  'Rulindo','Rusizi','Rutsiro','Rwamagana',
];

export default function RegisterPage() {
  const t = useTranslations('auth');
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-10">
      <div className="bg-white border border-gray-200 rounded-xl p-8 w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-6">{t('registerTitle')}</h1>
        <form className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">{t('fullName')}</label>
            <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">{t('email')}</label>
            <input type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">{t('password')}</label>
            <input type="password" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">{t('role')}</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500">
              <option value="farmer">{t('roles.farmer')}</option>
              <option value="buyer">{t('roles.buyer')}</option>
              <option value="coop_admin">{t('roles.coop_admin')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">{t('district')}</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500">
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">{t('languagePref')}</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500">
              <option value="rw">{t('languages.rw')}</option>
              <option value="en">{t('languages.en')}</option>
            </select>
          </div>
          <button type="submit" className="bg-green-700 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-800">
            {t('registerButton')}
          </button>
        </form>
        <p className="text-sm text-gray-500 text-center mt-4">
          {t('hasAccount')}{' '}
          <Link href="/login" className="text-green-700 hover:underline">{t('login')}</Link>
        </p>
      </div>
    </div>
  );
}
