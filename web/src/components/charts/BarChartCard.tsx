import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardBody, CardHeader } from '../ui/Card';

type BarChartCardProps = {
  title: string;
  subtitle?: string;
  data: { name: string; value: number; formattedValue?: string }[];
};

export function BarChartCard({ title, subtitle, data }: BarChartCardProps) {
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <CardBody className="h-64 pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{
                fill: 'var(--color-text-muted)',
                fontSize: 12,
                fontFamily: 'var(--font-body)',
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
            <Bar dataKey="value" fill="var(--color-chart-1)" radius={0}>
              <LabelList
                dataKey="formattedValue"
                position="top"
                fill="var(--color-text)"
                fontSize={12}
                fontFamily="var(--font-numeric)"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
