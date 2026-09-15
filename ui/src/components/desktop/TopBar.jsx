import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Calendar, Menu, Plus, Search } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext.jsx';
import { getActiveNavItem } from '../../utils/navActive.js';

export default function TopBar({ onMenuClick }) {
  const { appName } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const currentPage = useMemo(
    () => getActiveNavItem(location.pathname)?.label || 'Dashboard',
    [location.pathname],
  );

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;
    if (q.includes('order')) navigate('/orders');
    else if (q.includes('customer')) navigate('/customers');
    else if (q.includes('sale')) navigate('/sales');
    else if (q.includes('stock')) navigate('/stock');
    else if (q.includes('expense')) navigate('/expenses');
    else navigate('/orders');
  };

  return (
    <header className="topbar-shell z-30 flex h-14 shrink-0 items-center gap-4 px-4 lg:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg border border-primary-soft p-2 text-ink-muted hover:bg-primary-soft lg:hidden"
      >
        <Menu size={18} />
      </button>

      <div className="hidden min-w-0 lg:block">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{appName}</p>
        <p className="truncate text-sm font-bold text-ink">{currentPage}</p>
      </div>

      <form onSubmit={handleSearch} className="mx-auto hidden max-w-xl flex-1 md:block">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search orders, customers, sales…"
            className="w-full rounded-lg border border-primary-soft bg-background py-2 pl-9 pr-4 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-lg bg-primary-soft/80 px-3 py-2 text-xs font-medium text-ink-secondary xl:flex">
          <Calendar size={14} className="text-accent" />
          {today}
        </div>
        <button type="button" className="relative rounded-lg border border-primary-soft p-2 text-ink-muted hover:bg-primary-soft">
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
        </button>
        <button
          type="button"
          onClick={() => navigate('/orders/new')}
          className="hidden items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-accent/90 sm:flex"
        >
          <Plus size={16} />
          New Order
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-navy to-navy-light text-sm font-bold text-white">
          K
        </div>
      </div>
    </header>
  );
}
