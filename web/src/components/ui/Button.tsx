import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

const buttonVariants = cva(
  'app-button inline-flex items-center justify-center whitespace-nowrap border font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus-ring disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'app-button--primary',
        accent: 'app-button--accent',
        secondary: 'app-button--secondary',
        danger: 'app-button--danger',
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
