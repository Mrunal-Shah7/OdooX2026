import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '../../lib/cn';

export type SelectOption = { value: string; label: string };

const EMPTY_OPTION_VALUE = '__pp360_empty_option__';

type SelectProps = {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  options: SelectOption[];
  disabled?: boolean;
  id?: string;
  className?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
};

export function Select({
  value,
  onValueChange,
  placeholder = 'Select…',
  options,
  disabled,
  id,
  className,
  searchable = false,
  searchPlaceholder = 'Search options',
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selectedValue = value === '' ? EMPTY_OPTION_VALUE : value;
  const visibleOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!searchable || !normalizedQuery) return options;
    return options.filter((option) => option.label.toLowerCase().includes(normalizedQuery));
  }, [options, query, searchable]);

  return (
    <SelectPrimitive.Root
      value={selectedValue}
      onValueChange={(nextValue) => onValueChange?.(nextValue === EMPTY_OPTION_VALUE ? '' : nextValue)}
      disabled={disabled}
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setQuery('');
      }}
    >
      <SelectPrimitive.Trigger
        id={id}
        className={cn(
          'flex h-[var(--control-height)] w-full items-center justify-between rounded-md border border-border bg-surface px-3 text-body-sm text-text focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus-ring',
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown className="size-4 text-text-muted" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="z-[500] max-h-60 overflow-y-auto rounded-md border border-border bg-surface-raised p-1 shadow-lg min-w-[var(--radix-select-trigger-width)]"
          position="popper"
          sideOffset={4}
        >
          {searchable ? (
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <Search className="size-4 shrink-0 text-text-muted" aria-hidden="true" />
              <input
                aria-label={searchPlaceholder}
                autoFocus
                className="w-full bg-transparent text-body-sm text-text outline-none placeholder:text-text-subtle"
                placeholder={searchPlaceholder}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onPointerDown={(event) => event.stopPropagation()}
                onKeyDown={(event) => {
                  if (event.key !== 'Escape') event.stopPropagation();
                }}
              />
            </div>
          ) : null}
          <SelectPrimitive.Viewport className="p-1">
            {visibleOptions.length ? (
              visibleOptions.map((opt) => (
                <SelectPrimitive.Item
                  key={opt.value}
                  value={opt.value || EMPTY_OPTION_VALUE}
                  className="cursor-pointer rounded-sm px-3 py-2 text-body-sm outline-none focus:bg-primary-subtle data-[highlighted]:bg-primary-subtle"
                >
                  <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))
            ) : (
              <p className="px-3 py-2 text-body-sm text-text-muted">No matching options.</p>
            )}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
