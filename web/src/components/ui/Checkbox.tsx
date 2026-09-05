import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '../../lib/cn';

type CheckboxProps = {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
};

export function Checkbox({ id, checked, onCheckedChange, disabled, label, className }: CheckboxProps) {
  return (
    <label className={cn('inline-flex items-center gap-2 text-body-sm', className)}>
      <CheckboxPrimitive.Root
        id={id}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange?.(v === true)}
        disabled={disabled}
        className="flex size-4 items-center justify-center rounded-sm border border-border-strong bg-surface focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus-ring data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=checked]:text-on-accent"
      >
        <CheckboxPrimitive.Indicator>
          <Check className="size-3" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label ? <span>{label}</span> : null}
    </label>
  );
}
