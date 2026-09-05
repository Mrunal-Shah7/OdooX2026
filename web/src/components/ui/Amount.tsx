import { formatMoney } from '../../lib/format';
import { cn } from '../../lib/cn';

type AmountProps = {
  value: string;
  currency?: 'INR' | 'USD';
  className?: string;
  negative?: boolean;
};

export function Amount({ value, currency = 'INR', className, negative }: AmountProps) {
  return (
    <span className={cn('font-mono', negative && 'text-danger', className)}>
      {formatMoney(value, currency)}
    </span>
  );
}
