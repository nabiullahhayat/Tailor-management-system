import { Search, X } from 'lucide-react';

export default function SearchInput({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className="relative mb-4">
      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-black/10 bg-surface py-3 pl-10 pr-10 text-sm text-ink outline-none transition focus:border-navy"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
