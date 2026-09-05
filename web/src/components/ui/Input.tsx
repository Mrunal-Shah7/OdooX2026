import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  numeric?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, numeric, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-[var(--control-height)] w-full rounded-md border border-border bg-surface px-3 text-body-sm text-text focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus-ring',
        numeric && 'font-mono text-right',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
