const variants = {
  primary: 'bg-navy text-white shadow-lg hover:bg-navy-light',
  success: 'bg-success text-white shadow-lg hover:opacity-90',
  danger: 'bg-danger text-white shadow-lg hover:opacity-90',
  outline: 'border border-black/10 bg-surface text-ink hover:bg-background',
  ghost: 'text-ink-muted hover:bg-background hover:text-ink',
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
