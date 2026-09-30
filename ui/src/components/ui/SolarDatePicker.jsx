import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  addSolarMonths,
  daysInSolarMonth,
  compareSolarDateParts,
  formatSolarFromParts,
  getTodaySolarParts,
  normalizeSolarDateString,
  parseSolarParts,
  SOLAR_MONTH_NAMES,
  solarMonthStartWeekday,
} from '../../utils/solarDate.js';

export default function SolarDatePicker({
  label,
  value,
  onChange,
  error,
  placeholder,
  className = '',
  allowEmpty = true,
  minDate,
}) {
  const { t } = useTranslation();
  const rootRef = useRef(null);
  const weekdays = useMemo(
    () => [
      t('calendar.sun'),
      t('calendar.mon'),
      t('calendar.tue'),
      t('calendar.wed'),
      t('calendar.thu'),
      t('calendar.fri'),
      t('calendar.sat'),
    ],
    [t],
  );
  const [open, setOpen] = useState(false);
  const today = getTodaySolarParts();
  const minParts = useMemo(
    () => (minDate ? parseSolarParts(minDate) : null),
    [minDate],
  );
  const selected = parseSolarParts(value);

  const [viewYear, setViewYear] = useState(selected?.year ?? today.year);
  const [viewMonth, setViewMonth] = useState(selected?.month ?? today.month);

  useEffect(() => {
    if (!open) return;
    const parts = parseSolarParts(value) || today;
    setViewYear(parts.year);
    setViewMonth(parts.month);
  }, [open, value, today.year, today.month]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const monthLength = daysInSolarMonth(viewYear, viewMonth);
  const startPad = solarMonthStartWeekday(viewYear, viewMonth);
  const cells = useMemo(() => {
    const list = [];
    for (let i = 0; i < startPad; i += 1) list.push(null);
    for (let d = 1; d <= monthLength; d += 1) list.push(d);
    return list;
  }, [startPad, monthLength]);

  const isDayDisabled = (day) => {
    if (!minParts) return false;
    return compareSolarDateParts({ year: viewYear, month: viewMonth, day }, minParts) < 0;
  };

  const canShiftMonth = (delta) => {
    if (delta >= 0 || !minParts) return true;
    const next = addSolarMonths(viewYear, viewMonth, delta);
    if (next.year > minParts.year) return true;
    if (next.year === minParts.year && next.month >= minParts.month) return true;
    return false;
  };

  const pickDay = (day) => {
    if (isDayDisabled(day)) return;
    const next = formatSolarFromParts({ year: viewYear, month: viewMonth, day });
    onChange?.(normalizeSolarDateString(next));
    setOpen(false);
  };

  const shiftMonth = (delta) => {
    if (!canShiftMonth(delta)) return;
    const next = addSolarMonths(viewYear, viewMonth, delta);
    setViewYear(next.year);
    setViewMonth(next.month);
  };

  const displayValue = value ? normalizeSolarDateString(value) : '';

  return (
    <div className={`relative mb-4 ${className}`} ref={rootRef}>
      {label && (
        <label className="mb-1.5 block text-sm font-semibold text-ink-secondary">{label}</label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`input-field flex w-full items-center justify-between gap-2 rounded-xl border-2 bg-surface px-3 py-2.5 text-start text-base text-ink outline-none transition ${
            error ? 'border-danger' : ''
          }`}
        >
          <span className={displayValue ? '' : 'text-ink-muted'}>
            {displayValue || placeholder || t('common.dateFormatPlaceholder')}
          </span>
          <Calendar size={18} className="shrink-0 text-ink-muted" />
        </button>
        {allowEmpty && displayValue && (
          <button
            type="button"
            className="absolute end-10 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-muted hover:text-danger"
            onClick={(e) => {
              e.stopPropagation();
              onChange?.('');
              setOpen(false);
            }}
          >
            ×
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}

      {open && (
        <div className="absolute z-50 mt-2 w-full min-w-[280px] rounded-2xl border border-primary-soft/80 bg-surface p-3 shadow-[0_16px_48px_-12px_rgba(10,25,41,0.2)]">
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              className="rounded-lg p-1.5 text-ink-muted hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => shiftMonth(-1)}
              disabled={!canShiftMonth(-1)}
              aria-label={t('common.prevMonth')}
            >
              <ChevronLeft size={18} />
            </button>
            <p className="text-sm font-bold text-ink">
              {SOLAR_MONTH_NAMES[viewMonth]} {viewYear}
            </p>
            <button
              type="button"
              className="rounded-lg p-1.5 text-ink-muted hover:bg-background"
              onClick={() => shiftMonth(1)}
              aria-label={t('common.nextMonth')}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase text-ink-muted">
            {weekdays.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) => {
              if (day == null) return <span key={`e-${idx}`} />;
              const isSelected =
                selected &&
                selected.year === viewYear &&
                selected.month === viewMonth &&
                selected.day === day;
              const isToday =
                today.year === viewYear && today.month === viewMonth && today.day === day;
              const disabled = isDayDisabled(day);
              return (
                <button
                  key={`d-${day}`}
                  type="button"
                  onClick={() => pickDay(day)}
                  disabled={disabled}
                  className={`rounded-lg py-1.5 text-sm font-semibold transition ${
                    disabled
                      ? 'cursor-not-allowed text-ink-muted/35'
                      : isSelected
                        ? 'bg-navy text-white'
                        : isToday
                          ? 'bg-accent/15 text-accent'
                          : 'text-ink hover:bg-background'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
          {(!minParts || compareSolarDateParts(today, minParts) >= 0) && (
            <button
              type="button"
              className="mt-3 w-full rounded-lg bg-background py-2 text-xs font-bold text-accent hover:bg-accent/10"
              onClick={() => {
                onChange?.(formatSolarFromParts(today));
                setOpen(false);
              }}
            >
              {formatSolarFromParts(today)}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
