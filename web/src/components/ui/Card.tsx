import { type ReactNode } from 'react';
import { cn } from '../../lib/cn';

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn('rounded-lg border border-border bg-surface', className)}>{children}</div>
  );
}

type CardHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function CardHeader({ title, subtitle, actions }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
      <div>
        <h2 className="m-0 text-h3 font-semibold leading-snug">{title}</h2>
        {subtitle ? (
          <p className="m-0 mt-1 font-mono text-caption text-text-muted">{subtitle}</p>
        ) : null}
      </div>
      {actions}
    </div>
  );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('p-5', className)}>{children}</div>;
}
