import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

type DonutRingProps = {
  value: number;
  total: number;
  label: string;
  unit?: string;
  color?: string;
  isUnlimited?: boolean;
};

export function DonutRing({
  value,
  total,
  label,
  unit = '',
  color = 'var(--color-chart-1)',
  isUnlimited = false,
}: DonutRingProps) {
  const remaining = Math.max(0, total - value);
  const hasBalance = isUnlimited || total > 0;
  const data = isUnlimited
    ? [{ name: 'unlimited', value: 1 }]
    : hasBalance
      ? [
          { name: 'used', value },
          { name: 'remaining', value: remaining },
        ]
      : [{ name: 'remaining', value: 1 }];

  const trackColor = !isUnlimited && value === 0 && total > 0 ? `${color}40` : "var(--color-chart-track)";

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
              {isUnlimited ? (
                <Cell fill={color} />
              ) : (
                <>
                  {hasBalance ? <Cell fill={color} /> : null}
                  <Cell fill={trackColor} />
                </>
              )}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1">
        <div className="font-semibold text-text">{label}</div>
        <table className="mt-1 w-full border-collapse text-body-sm">
          <tbody>
            {!isUnlimited && (
              <tr>
                <td className="text-text-muted">Allocated</td>
                <td className="text-right font-mono">{total.toFixed(2)}{unit ? ` ${unit}` : ''}</td>
              </tr>
            )}
            <tr>
              <td className="text-text-muted">Taken</td>
              <td className="text-right font-mono">{value.toFixed(2)}{unit ? ` ${unit}` : ''}</td>
            </tr>
            {isUnlimited ? (
              <tr>
                <td className="text-text-muted">Remaining</td>
                <td className="text-right">
                  <span className="inline-flex items-center rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-text-muted">
                    Unlimited
                  </span>
                </td>
              </tr>
            ) : (
              <tr>
                <td className="text-text-muted">Remaining</td>
                <td className="text-right font-mono font-semibold text-text">
                  {remaining.toFixed(2)}{unit ? ` ${unit}` : ''}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
