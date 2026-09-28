/** Per-row bar gradients keyed by data `fill` color (same as chartData.js). */
export default function ModernBarGradients({ data, idPrefix = 'bar' }) {
  const colors = [...new Set((data || []).map((d) => d.fill).filter(Boolean))];
  return (
    <defs>
      {colors.map((color) => (
        <linearGradient key={color} id={`${idPrefix}-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={1} />
          <stop offset="100%" stopColor={color} stopOpacity={0.72} />
        </linearGradient>
      ))}
    </defs>
  );
}

export function barGradientUrl(color, idPrefix = 'bar') {
  if (!color) return color;
  return `url(#${idPrefix}-${String(color).replace('#', '')})`;
}
