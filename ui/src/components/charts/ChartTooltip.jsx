export default function ChartTooltip({ active, payload, label, valueFormatter, labelFormatter }) {
  if (!active || !payload?.length) return null;

  const displayLabel = labelFormatter ? labelFormatter(label) : label;

  return (
    <div className="min-w-[9rem] rounded-xl border border-primary-soft/70 bg-surface/95 px-3.5 py-2.5 shadow-[0_8px_30px_rgba(10,25,41,0.12)] backdrop-blur-md">
      {displayLabel != null && displayLabel !== '' && (
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
          {displayLabel}
        </p>
      )}
      <ul className="space-y-1.5">
        {payload.map((entry) => {
          const raw = entry.value;
          const formatted = valueFormatter ? valueFormatter(raw, entry.name, entry) : raw;
          const text = Array.isArray(formatted) ? formatted[0] : formatted;
          return (
            <li key={`${entry.dataKey}-${entry.name}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-xs font-medium text-ink-secondary">
                <span
                  className="h-2 w-2 shrink-0 rounded-full ring-2 ring-white"
                  style={{ backgroundColor: entry.color || entry.payload?.fill }}
                />
                {entry.name}
              </span>
              <span className="text-sm font-bold tabular-nums text-ink">{text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
