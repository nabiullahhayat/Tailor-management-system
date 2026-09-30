const variants = {
  primary:
    'bg-accent text-white shadow-md hover:bg-accent/90 dark:bg-accent dark:text-white dark:shadow-lg dark:shadow-accent/25 dark:hover:bg-accent/85',
  success:
    'bg-success text-white shadow-md hover:opacity-90 dark:shadow-success/20',
  danger:
    'bg-danger text-white shadow-md hover:opacity-90 dark:shadow-danger/20',
  outline:
    'border border-black/10 bg-surface text-ink hover:bg-background dark:border-white/30 dark:bg-surface/80 dark:text-ink dark:hover:border-white/45 dark:hover:bg-primary-soft/40',
  ghost:
    'text-ink-muted hover:bg-background hover:text-ink dark:text-ink-muted dark:hover:bg-primary-soft/35 dark:hover:text-ink',
};

export default function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
