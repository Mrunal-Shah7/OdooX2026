import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { type ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type DropdownItem = {
  label: string;
  onSelect?: () => void;
  destructive?: boolean;
};

type DropdownProps = {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'start' | 'center' | 'end';
};

export function Dropdown({ trigger, items, align = 'end' }: DropdownProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          className="z-dropdown min-w-40 rounded-md border border-border bg-surface-raised p-1 shadow-md"
        >
          {items.map((item) => (
            <DropdownMenu.Item
              key={item.label}
              onSelect={item.onSelect}
              className={cn(
                'cursor-pointer rounded-sm px-3 py-2 text-body-sm outline-none focus:bg-primary-subtle data-[highlighted]:bg-primary-subtle',
                item.destructive && 'text-danger',
              )}
            >
              {item.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
