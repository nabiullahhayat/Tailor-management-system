import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ChartTooltip from '../charts/ChartTooltip.jsx';
import ModernBarGradients, { barGradientUrl } from '../charts/ModernBarGradients.jsx';
import { CHART_ANIMATION, CHART_GRID, chartXAxisProps } from '../charts/chartTheme.js';

/**
 * Horizontal bars with category names in a column beside the plot (not inside chart margin).
 */
export default function VerticalCategoryBarChart({
  data,
  valueKey,
  formatXTick,
  formatTooltip,
}) {
  if (!data?.length) {
    return <div className="flex h-64 items-center justify-center text-sm text-ink-muted">—</div>;
  }

  return (
    <div className="flex h-64 w-full min-w-0 items-stretch gap-2 sm:gap-3">
      <div className="flex w-[min(42%,10.5rem)] shrink-0 flex-col justify-around py-3">
        {data.map((entry) => (
          <div
            key={entry.name}
            className="flex min-h-[1.75rem] items-center justify-end text-end text-xs font-medium leading-snug text-ink-secondary sm:text-sm"
            title={entry.name}
          >
            <span className="line-clamp-2 break-words">{entry.name}</span>
          </div>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 12, right: 8, left: 0, bottom: 12 }}
            barCategoryGap="22%"
            barSize={30}
          >
            <ModernBarGradients data={data} idPrefix="expBar" />
            <CartesianGrid {...CHART_GRID} horizontal={false} />
            <XAxis type="number" {...chartXAxisProps({ tickFormatter: formatXTick, dy: 0 })} />
            <YAxis type="category" dataKey="name" hide width={0} />
            <Tooltip content={<ChartTooltip valueFormatter={formatTooltip} />} />
            <Bar dataKey={valueKey} radius={[0, 10, 10, 0]} {...CHART_ANIMATION}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={barGradientUrl(entry.fill, 'expBar')} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
