import { TrendingDown, TrendingUp } from 'lucide-react';

export default function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  accent = 'navy',
}) {
  const accents = {
    navy: 'from-navy to-navy-light',
    success: 'from-emerald-600 to-emerald-700',
    danger: 'from-red-500 to-red-600',
    warning: 'from-amber-500 to-orange-600',
    info: 'from-blue-600 to-indigo-600',
  };

  const positive = trend >= 0;

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{title}</p>
          <p className="mt-2 truncate text-3xl font-extrabold tracking-tight text-ink">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
          {trendLabel && (
            <div className={`mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
              positive ? 'bg-emerald-50 text-success' : 'bg-red-50 text-danger'
            }`}>
              {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {trendLabel}
            </div>
          )}
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accents[accent]} text-white shadow-lg`}>
          {Icon && <Icon size={22} />}
        </div>
      </div>
    </div>
  );
}
