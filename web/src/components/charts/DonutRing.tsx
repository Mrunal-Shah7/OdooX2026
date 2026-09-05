import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

type DonutRingProps = {
  value: number;
  total: number;
  label: string;
  color?: string;
};

export function DonutRing({
  value,
  total,
  label,
  color = 'var(--color-chart-1)',
}: DonutRingProps) {
  const remaining = Math.max(0, total - value);
  const data = [
    { name: 'used', value },
    { name: 'remaining', value: remaining },
  ];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-28 w-28">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={32}
              outerRadius={48}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              <Cell fill={color} />
              <Cell fill="var(--color-chart-track)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-h3 font-semibold text-text">{value}</span>
          <span className="font-mono text-caption text-text-muted">/ {total}</span>
        </div>
      </div>
      <span className="text-label text-text-muted">{label}</span>
    </div>
  );
}
