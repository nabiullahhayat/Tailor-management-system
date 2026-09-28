export default function ChartAreaGradients() {
  return (
    <defs>
      <linearGradient id="chartIncomeFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#00a76f" stopOpacity={0.45} />
        <stop offset="85%" stopColor="#00a76f" stopOpacity={0.02} />
      </linearGradient>
      <linearGradient id="chartExpenseFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ff5630" stopOpacity={0.35} />
        <stop offset="85%" stopColor="#ff5630" stopOpacity={0.02} />
      </linearGradient>
      <linearGradient id="chartIncomeStroke" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#00a76f" />
        <stop offset="100%" stopColor="#00c896" />
      </linearGradient>
      <linearGradient id="chartExpenseStroke" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#ff5630" />
        <stop offset="100%" stopColor="#ff8a65" />
      </linearGradient>
    </defs>
  );
}
