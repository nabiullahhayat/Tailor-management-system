export const CHART_ANIMATION = {
  animationDuration: 750,
  animationEasing: 'ease-out',
  isAnimationActive: true,
};

export const CHART_MARGIN = { top: 8, right: 12, left: 4, bottom: 8 };

export const CHART_GRID = {
  strokeDasharray: '4 10',
  stroke: '#cbd5e1',
  strokeOpacity: 0.65,
};

export const AXIS_TICK = {
  fill: '#64748b',
  fontSize: 11,
  fontWeight: 500,
};

export const AXIS_HIDDEN = {
  axisLine: false,
  tickLine: false,
};

export function chartXAxisProps(extra = {}) {
  return {
    tick: AXIS_TICK,
    axisLine: { stroke: '#e2e8f0', strokeOpacity: 0.8 },
    tickLine: false,
    dy: 8,
    ...extra,
  };
}

export function chartYAxisProps(extra = {}) {
  return {
    tick: AXIS_TICK,
    axisLine: false,
    tickLine: false,
    width: 48,
    ...extra,
  };
}

export const LEGEND_STYLE = {
  paddingTop: 12,
  fontSize: 12,
  fontWeight: 500,
  color: '#64748b',
};

export const AREA_INCOME = { stroke: '#00a76f', fillId: 'chartIncomeFill' };
export const AREA_EXPENSE = { stroke: '#ff5630', fillId: 'chartExpenseFill' };
