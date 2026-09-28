export default function ChartCard({ title, subtitle, children, action }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-primary-soft/70 bg-surface shadow-[0_1px_2px_rgba(10,25,41,0.04),0_16px_48px_-20px_rgba(10,25,41,0.14)]">
      <div className="flex items-start justify-between gap-4 border-b border-primary-soft/50 bg-gradient-to-b from-white via-white to-surface px-5 py-4">
        <div>
          <h3 className="text-base font-bold tracking-tight text-ink">{title}</h3>
          {subtitle && <p className="mt-1 text-sm leading-snug text-ink-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="chart-plot flex-1 p-4 sm:p-5">{children}</div>
    </div>
  );
}
