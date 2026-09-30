import { useTranslation } from 'react-i18next';

const STYLES = {
  Finding: 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-200',
  Ready: 'bg-emerald-100 text-success dark:bg-emerald-950/45 dark:text-emerald-200',
  Delivered: 'bg-blue-100 text-blue-700 dark:bg-blue-950/45 dark:text-blue-200',
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950/45 dark:text-amber-200',
  Partial: 'bg-orange-100 text-orange-700 dark:bg-orange-950/45 dark:text-orange-200',
  Paid: 'bg-emerald-100 text-success dark:bg-emerald-950/45 dark:text-emerald-200',
  Completed: 'bg-emerald-100 text-success dark:bg-emerald-950/45 dark:text-emerald-200',
};

export default function StatusBadge({ status }) {
  const { t } = useTranslation();
  return (
    <span
      className={`status-badge inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        STYLES[status] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200'
      }`}
    >
      {t(`status.${status}`, { defaultValue: status })}
    </span>
  );
}
