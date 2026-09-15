import { Eye, Pencil, Trash2 } from 'lucide-react';

const btnClass =
  'rounded-md p-1.5 text-ink-muted transition hover:bg-background hover:text-navy';
const deleteClass =
  'rounded-md p-1.5 text-ink-muted transition hover:bg-red-50 hover:text-danger';

export default function TableRowActions({ onView, onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} role="presentation">
      {onView && (
        <button type="button" onClick={onView} className={btnClass} aria-label="View" title="View">
          <Eye size={15} />
        </button>
      )}
      {onEdit && (
        <button type="button" onClick={onEdit} className={btnClass} aria-label="Edit" title="Edit">
          <Pencil size={15} />
        </button>
      )}
      {onDelete && (
        <button type="button" onClick={onDelete} className={deleteClass} aria-label="Delete" title="Delete">
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}
