import { type ReactNode } from 'react';
import { cn } from '../../lib/cn';

type FieldProps = {
  label?: string;
  htmlFor?: string;
  help?: string;
  error?: string;
  children: ReactNode;
  className?: string;
};

export function Field({ label, htmlFor, help, error, children, className }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1', error && 'text-danger', className)}>
      {label ? (
        <label htmlFor={htmlFor} className="text-label font-medium text-text-muted">
          {label}
        </label>
      ) : null}
      {children}
      {error ? (
        <span className="text-caption text-danger">{error}</span>
      ) : help ? (
        <span className="text-caption text-text-muted">{help}</span>
      ) : null}
    </div>
  );
}
