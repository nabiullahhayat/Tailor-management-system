export default function KpiChartCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = 'navy',
  className = '',
  children,
}) {
  const accents = {
    navy: 'from-navy to-navy-light',
    success: 'from-emerald-600 to-emerald-700',
    danger: 'from-red-500 to-red-600',
    warning: 'from-amber-500 to-orange-600',
    info: 'from-blue-600 to-indigo-600',
  };

  return (
    <div className={`flex h-full flex-col overflow-hidden rounded-2xl border border-primary-soft/70 bg-surface shadow-[0_1px_2px_rgba(10,25,41,0.04),0_16px_48px_-20px_rgba(10,25,41,0.14)] dark:border-primary-soft dark:shadow-none ${className}`.trim()}>
      <div className="chart-card-header flex items-start justify-between gap-4 border-b border-primary-soft/50 bg-surface px-5 py-4 dark:bg-surface">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{title}</p>
          <p className="mt-1 truncate text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accents[accent]} text-white shadow-lg`}>
            <Icon size={20} />
          </div>
        )}
      </div>
      <div className="chart-plot min-h-[148px] flex-1 p-4 sm:p-5">{children}</div>
    </div>
  );
}
