import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap border border-transparent font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-sunken disabled:text-text-subtle',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-on-primary hover:bg-primary-hover',
        accent: 'bg-accent text-on-accent hover:bg-accent-hover',
        secondary: 'border-border-strong bg-surface text-text hover:bg-primary-subtle',
        danger: 'border-border-strong bg-surface text-danger hover:bg-danger-subtle',
      },
      size: {
        sm: 'h-[var(--control-height-sm)] px-3 text-caption',
        md: 'h-[var(--control-height)] px-4 text-label',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), 'rounded-md', className)}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
