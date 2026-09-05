import * as PopoverPrimitive from '@radix-ui/react-popover';
import { ChevronDown, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '../../lib/cn';

export type SelectOption = { value: string; label: string };

type SearchableSelectProps = {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  options: SelectOption[];
  disabled?: boolean;
  id?: string;
  className?: string;
  onSearch?: (query: string) => void;
  loading?: boolean;
};

export function SearchableSelect({
  value,
  onValueChange,
  placeholder = 'Select…',
  options,
  disabled,
  id,
  className,
  onSearch,
  loading,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value),
    [options, value]
  );

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          setSearchQuery('');
          if (onSearch) onSearch('');
        }
      }}
    >
      <PopoverPrimitive.Trigger
        id={id}
        disabled={disabled}
        className={cn(
          'flex h-[var(--control-height)] w-full items-center justify-between rounded-md border border-border bg-surface px-3 text-body-sm text-text focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus-ring disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : <span className="text-text-muted">{placeholder}</span>}
        </span>
        <ChevronDown className="size-4 text-text-muted shrink-0" />
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-[500] flex flex-col w-[var(--radix-popover-trigger-width)] max-h-80 overflow-hidden rounded-md border border-border bg-surface-raised shadow-lg"
        >
          <div className="border-b border-border p-2">
            <div className="flex items-center gap-2 rounded-md bg-surface px-2 border border-border focus-within:border-focus-ring focus-within:ring-1 focus-within:ring-focus-ring">
              <Search className="size-4 text-text-muted shrink-0" />
              <input
                className="h-8 w-full bg-transparent text-body-sm outline-none placeholder:text-text-muted"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (onSearch) onSearch(e.target.value);
                }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-1">
            {options.length === 0 ? (
              <div className="p-2 text-center text-body-sm text-text-muted">
                {loading ? 'Loading...' : 'No results found'}
              </div>
            ) : (
              options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={cn(
                    'flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-left text-body-sm hover:bg-primary hover:text-white',
                    opt.value === value ? 'bg-primary-subtle font-medium text-primary' : 'text-text'
                  )}
                  onClick={() => {
                    if (opt.value === 'load_more') {
                      if (onValueChange) onValueChange(opt.value);
                      return;
                    }
                    if (onValueChange) onValueChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <span className="truncate">{opt.label}</span>
                </button>
              ))
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
