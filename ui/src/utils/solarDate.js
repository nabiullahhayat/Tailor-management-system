/** Convert Gregorian date to Afghan Solar (Jalali/Shamsi) calendar */

function gregorianToJalali(gy, gm, gd) {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days = (365 * gy)
    + Math.floor((gy2 + 3) / 4)
    - Math.floor((gy2 + 99) / 100)
    + Math.floor((gy2 + 399) / 400)
    - 80 + gd + g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  jy += Math.floor((days - 1) / 365);
  if (days > 365) days = (days - 1) % 365;
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return { year: jy, month: jm, day: jd };
}

export function toSolarDate(date = new Date()) {
  const { year, month, day } = gregorianToJalali(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );
  return `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
}

export function getTodaySolar() {
  return toSolarDate(new Date());
}

function jalaliToGregorian(jy, jm, jd) {
  let gy = jy <= 979 ? 621 : 1600;
  jy -= jy <= 979 ? 0 : 979;
  let days =
    365 * jy +
    Math.floor(jy / 33) * 8 +
    Math.floor(((jy % 33) + 3) / 4) +
    78 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  let leap = true;
  if (days >= 36525) {
    days -= 1;
    gy += 100 * Math.floor(days / 36524);
    days %= 36524;
    if (days >= 365) days += 1;
    else leap = false;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days >= 366) {
    leap = false;
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let gd = days + 1;
  const sal = [
    0,
    31,
    leap && ((gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  let gm = 0;
  for (gm = 1; gm <= 12; gm += 1) {
    if (gd <= sal[gm]) break;
    gd -= sal[gm];
  }
  return { year: gy, month: gm, day: gd };
}

export function isSolarDateString(value) {
  return /^\d{4}\/\d{1,2}\/\d{1,2}$/.test(String(value ?? '').trim());
}

/** Normalize YYYY/M/D → YYYY/MM/DD */
export function normalizeSolarDateString(value) {
  const m = String(value ?? '').trim().match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!m) return '';
  return `${m[1]}/${String(m[2]).padStart(2, '0')}/${String(m[3]).padStart(2, '0')}`;
}

export function parseSolarDateString(value) {
  const normalized = normalizeSolarDateString(value);
  if (!normalized) return null;
  const m = normalized.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  const { year, month, day } = jalaliToGregorian(Number(m[1]), Number(m[2]), Number(m[3]));
  return new Date(year, month - 1, day);
}

/** Keep solar strings; legacy Gregorian ISO dates unchanged. */
export function coerceDeliveryDateForState(value) {
  if (value == null || value === '') return '';
  const raw = String(value).trim();
  if (isSolarDateString(raw)) return normalizeSolarDateString(raw);
  const isoDay = raw.split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDay)) return isoDay;
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return raw;
}

export const SOLAR_MONTH_NAMES = [
  '', 'حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبله',
  'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت',
];
