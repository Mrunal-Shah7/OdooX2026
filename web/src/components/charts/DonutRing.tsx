import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

type DonutRingProps = {
  value: number;
  total: number;
  label: string;
  unit?: string;
  color?: string;
  isUnlimited?: boolean;
  isUnpaid?: boolean;
  pending?: number;
};

export function DonutRing({
  value,
  total,
  label,
  unit = '',
  color = 'var(--color-chart-1)',
  isUnlimited = false,
  isUnpaid = false,
  pending = 0,
}: DonutRingProps) {
  const remaining = Math.max(0, total - value);
  const hasAllocation = isUnlimited || total > 0;
  const trackColor = 'var(--color-chart-track)';

  const data = isUnpaid
    ? [{ name: 'Taken', value: 1 }]
    : isUnlimited
      ? [{ name: 'Unlimited', value: 1 }]
      : hasAllocation
        ? [
            { name: 'Taken', value },
            { name: 'Remaining', value: remaining },
          ]
        : [{ name: 'No allocation', value: 1 }];

  return (
    <div className="donut-ring flex items-center gap-4">
      <div
        className="donut-ring__visual relative h-20 w-20 shrink-0"
        role="img"
        aria-label={
          isUnpaid
            ? `${label}: ${value.toFixed(2)}${unit ? ` ${unit}` : ' days'} taken`
            : `${label}: ${value.toFixed(2)}${unit ? ` ${unit}` : ''} taken of ${total.toFixed(2)}${unit ? ` ${unit}` : ''}`
        }
      >
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
              isAnimationActive
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    isUnpaid
                      ? value > 0
                        ? color
                        : trackColor
                      : entry.name === 'Remaining' || entry.name === 'Unlimited'
                        ? color
                        : trackColor
                  }
                />
              ))}
            </Pie>
            {!isUnlimited && !isUnpaid ? (
              <Tooltip formatter={(tooltipValue: number, tooltipName: string) => [`${tooltipValue.toFixed(2)}${unit ? ` ${unit}` : ''}`, tooltipName]} />
            ) : isUnpaid ? (
              <Tooltip formatter={() => [`${value.toFixed(2)}${unit ? ` ${unit}` : ' days'}`, 'Taken']} />
            ) : null}
          </PieChart>
        </ResponsiveContainer>
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center font-mono text-caption font-semibold text-text">
          {isUnpaid
            ? `${value > 0 ? `${value}d` : '0d'}`
            : isUnlimited
              ? '∞'
              : hasAllocation
                ? `${Math.round((value / total) * 100)}%`
                : '—'}
        </span>
      </div>
      <div className="flex-1">
        <div className="font-semibold text-text">{label}</div>
        <table className="mt-1 w-full border-collapse text-body-sm">
          <tbody>
            {isUnpaid ? (
              <tr>
                <td className="text-text-muted">Taken</td>
                <td className="text-right font-mono font-medium">
                  {value.toFixed(2)}
                  {unit ? ` ${unit}` : ' days'}
                </td>
              </tr>
            ) : (
              <>
                {!isUnlimited && (
                  <tr>
                    <td className="text-text-muted">Allocated</td>
                    <td className="text-right font-mono">
                      {total.toFixed(2)}
                      {unit ? ` ${unit}` : ''}
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="text-text-muted">Taken</td>
                  <td className="text-right font-mono">
                    {value.toFixed(2)}
                    {unit ? ` ${unit}` : ''}
                  </td>
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
                ) : pending > 0 ? (
                  <>
                    <tr>
                      <td className="text-text-muted">Pending</td>
                      <td className="text-right font-mono text-warning">{pending.toFixed(2)}{unit ? ` ${unit}` : ''}</td>
                    </tr>
                    <tr>
                      <td className="text-text-muted">Remaining</td>
                      <td className="text-right font-mono font-semibold text-text">
                        {remaining.toFixed(2)}{unit ? ` ${unit}` : ''}
                      </td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td className="text-text-muted">Remaining</td>
                    <td className="text-right font-mono font-semibold text-text">
                      {remaining.toFixed(2)}
                      {unit ? ` ${unit}` : ''}
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
