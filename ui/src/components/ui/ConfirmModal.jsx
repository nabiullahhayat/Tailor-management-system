import { useTranslation } from 'react-i18next';
import Modal from './Modal.jsx';

export default function ConfirmModal({
  open,
  title,
  subtitle,
  rows = [],
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}) {
  const { t } = useTranslation();
  return (
    <Modal open={open} onClose={onCancel} title={title} subtitle={subtitle} size="md">
      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className={`flex items-start justify-between gap-4 rounded-xl px-3 py-2 ${
              row.highlight ? 'bg-emerald-50' : 'bg-background'
            }`}
          >
            <span className="text-sm text-ink-muted">{row.label}</span>
            <span
              className={`text-right text-sm font-semibold ${
                row.highlight ? 'text-success' : 'text-ink'
              }`}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-semibold text-ink-muted transition hover:bg-background dark:border-white/30 dark:hover:bg-primary-soft/35"
        >
          {cancelLabel || t('common.cancel')}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-accent/90 dark:shadow-lg dark:shadow-accent/25"
        >
          {confirmLabel || t('common.confirm')}
        </button>
      </div>
    </Modal>
  );
}
