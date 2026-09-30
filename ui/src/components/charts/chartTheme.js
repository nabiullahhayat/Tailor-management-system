import { useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext.jsx';

export const CHART_ANIMATION = {
  animationDuration: 750,
  animationEasing: 'ease-out',
  isAnimationActive: true,
};

export const CHART_MARGIN = { top: 8, right: 12, left: 4, bottom: 8 };

export const AREA_INCOME = { stroke: '#00a76f', fillId: 'chartIncomeFill' };
export const AREA_EXPENSE = { stroke: '#ff5630', fillId: 'chartExpenseFill' };

function buildChartTheme(isDark) {
  const tickFill = isDark ? '#94a3b8' : '#64748b';
  const gridStroke = isDark ? '#475569' : '#cbd5e1';
  const axisLineStroke = isDark ? '#475569' : '#e2e8f0';

  const CHART_GRID = {
    strokeDasharray: '4 10',
    stroke: gridStroke,
    strokeOpacity: isDark ? 0.55 : 0.65,
  };

  const AXIS_TICK = {
    fill: tickFill,
    fontSize: 11,
    fontWeight: 500,
  };

  const chartXAxisProps = (extra = {}) => ({
    tick: AXIS_TICK,
    axisLine: { stroke: axisLineStroke, strokeOpacity: 0.8 },
    tickLine: false,
    dy: 8,
    ...extra,
  });

  const chartYAxisProps = (extra = {}) => ({
    tick: AXIS_TICK,
    axisLine: false,
    tickLine: false,
    width: 48,
    ...extra,
  });

  const LEGEND_STYLE = {
    paddingTop: 12,
    fontSize: 12,
    fontWeight: 500,
    color: tickFill,
  };

  return {
    CHART_GRID,
    AXIS_TICK,
    chartXAxisProps,
    chartYAxisProps,
    LEGEND_STYLE,
  };
}

/** @deprecated use useChartTheme() for theme-aware charts */
export const CHART_GRID = buildChartTheme(false).CHART_GRID;
export const AXIS_TICK = buildChartTheme(false).AXIS_TICK;
export function chartXAxisProps(extra = {}) {
  return buildChartTheme(false).chartXAxisProps(extra);
}
export function chartYAxisProps(extra = {}) {
  return buildChartTheme(false).chartYAxisProps(extra);
}
export const LEGEND_STYLE = buildChartTheme(false).LEGEND_STYLE;

export function useChartTheme() {
  const { isDark } = useTheme();
  return useMemo(() => buildChartTheme(isDark), [isDark]);
}
