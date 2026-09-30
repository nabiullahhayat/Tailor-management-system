import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, subtitle, children, size = 'md' }) {
  if (!open) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close modal"
        onClick={onClose}
      />
      <div
        className={`app-scroll relative z-10 w-full ${sizes[size]} max-h-[90vh] overflow-y-auto rounded-2xl border border-black/5 bg-surface shadow-2xl dark:border-primary-soft/50`}
      >
        {(title || subtitle) && (
          <div className="flex items-start justify-between border-b border-black/5 px-5 py-4">
            <div>
              {title && <h3 className="text-lg font-bold text-ink">{title}</h3>}
              {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-ink-muted transition hover:bg-background hover:text-ink"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
