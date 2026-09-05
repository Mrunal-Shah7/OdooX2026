import * as TabsPrimitive from '@radix-ui/react-tabs';
import { type ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type TabItem = { value: string; label: string; content: ReactNode };

type TabsProps = {
  items: TabItem[];
  defaultValue?: string;
  className?: string;
};

export function Tabs({ items, defaultValue, className }: TabsProps) {
  const initial = defaultValue ?? items[0]?.value;
  return (
    <TabsPrimitive.Root defaultValue={initial} className={className}>
      <TabsPrimitive.List className="mb-4 flex gap-4 border-b border-border">
        {items.map((item) => (
          <TabsPrimitive.Trigger
            key={item.value}
            value={item.value}
            className={cn(
              'border-b-2 border-transparent px-1 pb-2 text-label text-text-muted data-[state=active]:border-accent data-[state=active]:font-semibold data-[state=active]:text-text',
            )}
          >
            {item.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {items.map((item) => (
        <TabsPrimitive.Content key={item.value} value={item.value}>
          {item.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}
