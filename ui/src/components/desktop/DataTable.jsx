import TablePagination, { DEFAULT_PAGE_SIZE, usePagination } from './TablePagination.jsx';

export default function DataTable({
  columns,
  rows,
  onRowClick,
  emptyMessage = 'No records found',
  compact = false,
  pageSize = DEFAULT_PAGE_SIZE,
  paginate = true,
  wrapCells = false,
}) {
  const {
    page,
    setPage,
    pageItems,
    totalPages,
    totalItems,
    start,
    end,
  } = usePagination(rows, pageSize);

  const displayRows = paginate ? pageItems : rows;

  return (
    <div className="panel overflow-hidden">
      <div className={`app-scroll ${compact ? 'overflow-x-hidden' : 'overflow-x-auto'}`}>
        <table className={`${compact ? 'data-table-compact' : 'data-table'}${wrapCells ? ' data-table-wrap' : ''}`}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={col.className}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-sm text-ink-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              displayRows.map((row) => (
                <tr
                  key={row.id ?? row.tokenNumber ?? row.name}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={onRowClick ? 'cursor-pointer' : ''}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={col.className}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {paginate && rows.length > 0 && (
        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          start={start}
          end={end}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
