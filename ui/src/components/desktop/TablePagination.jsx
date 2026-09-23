import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const DEFAULT_PAGE_SIZE = 8;

function buildPageList(current, total) {
  if (total <= 1) return [1];
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push('…');
    out.push(sorted[i]);
  }
  return out;
}

export function usePagination(items, pageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const list = items || [];
  const totalItems = list.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const resetKey = useMemo(
    () => (list.length ? list.map((r) => r.id ?? r.name).join('|') : ''),
    [list],
  );

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, totalItems);
  const pageItems = list.slice((safePage - 1) * pageSize, safePage * pageSize);

  return {
    page: safePage,
    setPage,
    pageItems,
    totalPages,
    totalItems,
    start,
    end,
    pageSize,
  };
}

export default function TablePagination({
  page,
  totalPages,
  totalItems,
  pageSize = DEFAULT_PAGE_SIZE,
  start,
  end,
  onPageChange,
}) {
  const pages = buildPageList(page, totalPages);

  const pageOptions = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i + 1),
    [totalPages],
  );

  if (totalItems <= pageSize) return null;

  return (
    <div className="table-pagination flex flex-col gap-3 border-t border-primary-soft/80 bg-surface px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
      <p className="text-sm text-ink-muted">
        Showing{' '}
        <span className="font-semibold text-ink">
          {start}–{end}
        </span>{' '}
        of <span className="font-semibold text-ink">{totalItems}</span>
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <span className="whitespace-nowrap font-medium">Go to page</span>
          <select
            value={page}
            onChange={(e) => onPageChange(Number(e.target.value))}
            className="table-pagination-select"
            aria-label="Select page"
          >
            {pageOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <span className="whitespace-nowrap">
            of <span className="font-semibold text-ink">{totalPages}</span>
          </span>
        </label>

        <nav className="flex flex-wrap items-center justify-center gap-1" aria-label="Table pagination">
          <button
            type="button"
            className="table-pagination-btn"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft size={18} />
          </button>
          {pages.map((p, i) =>
            p === '…' ? (
              <span key={`ellipsis-${i}`} className="px-1 text-sm text-ink-muted">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                className={`table-pagination-page ${page === p ? 'table-pagination-page-active' : ''}`}
                onClick={() => onPageChange(p)}
                aria-current={page === p ? 'page' : undefined}
              >
                {p}
              </button>
            ),
          )}
          <button
            type="button"
            className="table-pagination-btn"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight size={18} />
          </button>
        </nav>
      </div>
    </div>
  );
}
