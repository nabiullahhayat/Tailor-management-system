export default function ChartCard({ title, subtitle, children, action }) {
  return (
    <div className="panel flex h-full flex-col">
      <div className="flex items-start justify-between gap-4 border-b border-black/5 px-5 py-4">
        <div>
          <h3 className="text-base font-bold text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="flex-1 p-5">{children}</div>
    </div>
  );
}
