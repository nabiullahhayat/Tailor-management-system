import { useTranslation } from 'react-i18next';

const STYLES = {
  Finding: 'bg-violet-100 text-violet-700',
  Ready: 'bg-emerald-100 text-success',
  Delivered: 'bg-blue-100 text-blue-700',
  Pending: 'bg-amber-100 text-amber-700',
  Partial: 'bg-orange-100 text-orange-700',
  Paid: 'bg-emerald-100 text-success',
  Completed: 'bg-emerald-100 text-success',
};

export default function StatusBadge({ status }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        STYLES[status] || 'bg-slate-100 text-slate-600'
      }`}
    >
      {t(`status.${status}`, { defaultValue: status })}
    </span>
  );
}
