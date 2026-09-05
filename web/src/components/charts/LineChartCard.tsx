import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardBody, CardHeader } from '../ui/Card';

type LineChartCardProps = {
  title: string;
  subtitle?: string;
  data: { name: string; value: number; formattedValue?: string }[];
};

export function LineChartCard({ title, subtitle, data }: LineChartCardProps) {
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <CardBody className="h-64 pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{
                fill: 'var(--color-text-muted)',
                fontSize: 12,
                fontFamily: 'var(--font-numeric)',
              }}
              axisLine={{ stroke: 'var(--color-border)' }}
              tickLine={false}
            />
            <YAxis
              tick={{
                fill: 'var(--color-text-muted)',
                fontSize: 12,
                fontFamily: 'var(--font-numeric)',
              }}
              axisLine={{ stroke: 'var(--color-border)' }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-surface-raised)',
                borderColor: 'var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-numeric)',
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-chart-1)"
              strokeWidth={2}
              dot={{ fill: 'var(--color-chart-1)', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
