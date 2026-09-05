import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardBody, CardHeader } from '../ui/Card';

type BarChartCardProps = {
  title: string;
  data: { name: string; value: number }[];
};

export function BarChartCard({ title, data }: BarChartCardProps) {
  return (
    <Card>
      <CardHeader title={title} />
      <CardBody className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
            <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" fill="var(--color-chart-1)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
