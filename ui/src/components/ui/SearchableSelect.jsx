import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';

/**
 * Search + visible option list (combobox). Typing filters and shows matching names.
 */
export default function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder,
  searchPlaceholder,
  emptyOptionLabel,
  className = '',
  error,
  /** Label for the empty / clear row at top of list */
  showClearOption = true,
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const selectedLabel = useMemo(
    () => options.find((o) => o.value === value)?.label ?? '',
    [options, value],
  );

  useEffect(() => {
    if (!open && value && selectedLabel) {
      setQuery(selectedLabel);
    }
    if (!value && !open) {
      setQuery('');
    }
  }, [value, selectedLabel, open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, query]);

  const pick = (opt) => {
    if (!opt) {
      onChange({ target: { value: '' } });
      setQuery('');
    } else {
      onChange({ target: { value: opt.value } });
      setQuery(opt.label);
    }
    setOpen(false);
  };

  useEffect(() => {
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const listOpen = open && (query.trim() !== '' || options.length > 0);

  return (
    <div className={className} ref={rootRef}>
      <div className="rounded-xl border border-primary-soft bg-background p-2">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filtered.length > 0) {
                e.preventDefault();
                pick(filtered[0]);
              }
              if (e.key === 'Escape') setOpen(false);
            }}
            placeholder={searchPlaceholder}
            className="input-field w-full rounded-lg border-2 bg-surface py-2 pl-8 pr-3 text-base text-ink outline-none"
          />
        </div>

        {listOpen && (
          <ul className="app-scroll mt-2 max-h-48 overflow-y-auto rounded-lg border border-primary-soft bg-surface py-1 shadow-sm">
            {showClearOption && emptyOptionLabel != null && (
              <li>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm text-ink-muted transition hover:bg-primary-soft/40"
                  onClick={() => pick(null)}
                >
                  {emptyOptionLabel}
                </button>
              </li>
            )}
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-ink-muted">{placeholder}</li>
            ) : (
              filtered.map((opt) => (
                <li key={opt.value}>
                  <button
                    type="button"
                    className={`w-full px-3 py-2 text-left text-sm transition hover:bg-primary-soft/40 ${
                      opt.value === value ? 'bg-primary-soft/50 font-semibold text-accent' : 'text-ink'
                    }`}
                    onClick={() => pick(opt)}
                  >
                    {opt.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
