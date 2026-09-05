import { useId, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { CalendarClock } from 'lucide-react';
import { Button } from './Button';
import { Calendar } from './Calendar';
import { Input } from './Input';
import { Popover } from './Popover';

type DateTimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  disabled?: boolean;
  readOnly?: boolean;
};

function getDate(value: string): Date | undefined {
  const dateKey = value.slice(0, 10);
  return dateKey ? parseISO(dateKey) : undefined;
}

function getTime(value: string): string {
  return value.length >= 16 ? value.slice(11, 16) : '';
}

function formatDateTime(value: string): string {
  return value ? format(parseISO(value), 'PP · HH:mm') : 'Select date and time';
}

export function DateTimePicker({
  value,
  onChange,
  ariaLabel,
  disabled,
  readOnly,
}: DateTimePickerProps) {
  const timeInputId = useId();
  const [open, setOpen] = useState(false);
  const [draftDate, setDraftDate] = useState<Date | undefined>(() => getDate(value));
  const [draftTime, setDraftTime] = useState(() => getTime(value));
  const triggerText = formatDateTime(value);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDraftDate(getDate(value));
      setDraftTime(getTime(value));
    }
    setOpen(nextOpen);
  }

  function applySelection() {
    if (!draftDate || !draftTime) return;
    onChange(`${format(draftDate, 'yyyy-MM-dd')}T${draftTime}`);
    setOpen(false);
  }

  function clearSelection() {
    setDraftDate(undefined);
    setDraftTime('');
    onChange('');
    setOpen(false);
  }

  const trigger = (
    <button
      type="button"
      className="date-picker__trigger"
      data-placeholder={value ? undefined : ''}
      data-readonly={readOnly ? '' : undefined}
      aria-label={ariaLabel ?? triggerText}
      aria-expanded={readOnly ? undefined : open}
      disabled={disabled}
    >
      <CalendarClock className="size-4" aria-hidden="true" />
      <span>{triggerText}</span>
    </button>
  );

  if (readOnly) return trigger;

  return (
    <Popover
      open={open}
      onOpenChange={handleOpenChange}
      align="start"
      className="date-picker-popover rounded-lg border border-border-strong p-0 shadow-none"
      trigger={trigger}
    >
      <div className="date-time-picker">
        <Calendar
          mode="single"
          selected={draftDate}
          defaultMonth={draftDate}
          onSelect={setDraftDate}
          showOutsideDays
          animate
        />

        <div className="date-time-picker__time-row">
          <label className="date-time-picker__time-label" htmlFor={timeInputId}>
            Time
          </label>
          <Input
            id={timeInputId}
            type="time"
            value={draftTime}
            onChange={(event) => setDraftTime(event.target.value)}
            className="font-mono"
          />
        </div>

        <div className="date-time-picker__actions">
          {value ? (
            <button type="button" className="date-picker__clear" onClick={clearSelection}>
              Clear
            </button>
          ) : (
            <span />
          )}
          <Button
            size="sm"
            variant="primary"
            disabled={!draftDate || !draftTime}
            onClick={applySelection}
          >
            Apply
          </Button>
        </div>
      </div>
    </Popover>
  );
}
