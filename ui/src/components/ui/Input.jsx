export default function Input({
  label,
  error,
  icon: Icon,
  className = '',
  ...props
}) {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="mb-1.5 block text-sm font-semibold text-ink-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
            <Icon size={18} />
          </span>
        )}
        <input
          className={`input-field w-full rounded-xl border-2 bg-surface px-3 py-2.5 text-base text-ink outline-none transition ${
            Icon ? 'pl-10' : ''
          } ${error ? 'border-danger focus:border-danger' : ''}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
