import * as PopoverPrimitive from '@radix-ui/react-popover';
import { type ReactNode } from 'react';
import { cn } from '../../lib/cn';

type PopoverProps = {
  trigger: ReactNode;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  align?: 'start' | 'center' | 'end';
};

export function Popover({
  trigger,
  children,
  open,
  onOpenChange,
  className,
  align = 'center',
}: PopoverProps) {
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align={align}
          className={cn(
            'z-[500] rounded-md border border-border bg-surface-raised p-4 shadow-md focus:outline-none',
            className,
          )}
          sideOffset={8}
        >
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
