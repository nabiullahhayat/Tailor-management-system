import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordInput({
  label,
  error,
  className = '',
  inputClassName = '',
  ...props
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="mb-1.5 block text-sm font-semibold text-ink-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          className={`input-field w-full rounded-xl border-2 bg-surface py-2.5 pe-11 ps-3 text-base text-ink outline-none transition ${inputClassName} ${
            error ? 'border-danger focus:border-danger' : ''
          }`}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute end-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-muted transition hover:bg-primary-soft/40 hover:text-ink"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
