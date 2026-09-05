import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

type DonutRingProps = {
  value: number;
  total: number;
  label: string;
  unit?: string;
  color?: string;
};

export function DonutRing({
  value,
  total,
  label,
  unit = '',
  color = 'var(--color-chart-1)',
}: DonutRingProps) {
  const remaining = Math.max(0, total - value);
  const data = [
    { name: 'used', value: value || (total === 0 ? 0 : 0.001) },
    { name: 'remaining', value: remaining },
  ];

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-20 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={24}
              outerRadius={36}
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
      </div>
      <div className="flex-1">
        <div className="font-semibold text-text">{label}</div>
        <table className="mt-1 w-full border-collapse text-body-sm">
          <tbody>
            <tr>
              <td className="text-text-muted">Allocated</td>
              <td className="text-right font-mono">{total.toFixed(2)}{unit ? ` ${unit}` : ''}</td>
            </tr>
            <tr>
              <td className="text-text-muted">Taken</td>
              <td className="text-right font-mono">{value.toFixed(2)}{unit ? ` ${unit}` : ''}</td>
            </tr>
            <tr>
              <td className="text-text-muted">Remaining</td>
              <td className="text-right font-mono font-semibold text-text">
                {remaining.toFixed(2)}{unit ? ` ${unit}` : ''}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
