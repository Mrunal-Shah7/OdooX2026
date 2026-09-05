import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardBody, CardHeader } from '../ui/Card';

type LineChartCardProps = {
  title: string;
  data: { name: string; value: number }[];
};

export function LineChartCard({ title, data }: LineChartCardProps) {
  return (
    <Card>
      <CardHeader title={title} />
      <CardBody className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
            <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="var(--color-chart-2)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
