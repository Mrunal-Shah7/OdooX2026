import { cn } from '../../lib/cn';

type SpinnerProps = {
  className?: string;
  label?: string;
};

export function Spinner({ className, label = 'Loading' }: SpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center py-8', className)} role="status">
      <span
        className="size-8 animate-spin rounded-full border-2 border-border border-t-accent"
        aria-hidden
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
