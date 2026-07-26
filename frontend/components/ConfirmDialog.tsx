'use client';

import { useTranslations } from 'next-intl';

type Props = {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

export default function ConfirmDialog({ open, message, onConfirm, onCancel, loading }: Props) {
  const tc = useTranslations('common');

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-hinga-ink/40 px-4"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        className="rise-in bg-white rounded-xl shadow-xl border border-hinga-green/10 p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-hinga-ink mb-5">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 border border-hinga-green/20 rounded-lg text-sm text-hinga-inkMuted hover:bg-hinga-green/5"
          >
            {tc('cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? tc('loading') : tc('delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
