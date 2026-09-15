import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PageShell({
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  children,
}) {
  return (
    <div className="flex min-h-full flex-col">
      <div className="border-b border-primary-soft bg-surface/80 px-6 py-5 lg:px-8">
        {breadcrumbs.length > 0 && (
          <nav className="mb-2 flex items-center gap-1 text-xs font-medium text-ink-muted">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.label} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={12} />}
                {crumb.to ? (
                  <Link to={crumb.to} className="hover:text-navy">{crumb.label}</Link>
                ) : (
                  <span className="text-ink">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      </div>
      <div className="flex-1 p-6 lg:p-8">{children}</div>
    </div>
  );
}
