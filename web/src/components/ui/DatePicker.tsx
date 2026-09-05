import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import type { DateRange, Matcher } from 'react-day-picker';
import { Calendar } from './Calendar';
import { Popover } from './Popover';

type DateRangeValue = {
  startDate: string;
  endDate: string;
};

type DatePickerBaseProps = {
  ariaLabel?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  min?: string;
  max?: string;
};

type SingleDatePickerProps = DatePickerBaseProps & {
  mode: 'single';
  value: string;
  onChange: (value: string) => void;
};

type RangeDatePickerProps = DatePickerBaseProps & {
  mode: 'range';
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
};

export type DatePickerProps = SingleDatePickerProps | RangeDatePickerProps;

function fromDateKey(value: string): Date | undefined {
  return value ? parseISO(value) : undefined;
}

function toDateKey(value: Date): string {
  return format(value, 'yyyy-MM-dd');
}

function formatDate(value: string): string {
  return value ? format(parseISO(value), 'PP') : '';
}

export function DatePicker(props: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selectedStart = props.mode === 'single' ? props.value : props.value.startDate;
  const selectedEnd = props.mode === 'range' ? props.value.endDate : props.value;
  const triggerText =
    props.mode === 'single'
      ? props.value
        ? formatDate(props.value)
        : 'Select date'
      : props.value.startDate
        ? props.value.endDate
          ? `${formatDate(props.value.startDate)} — ${formatDate(props.value.endDate)}`
          : `${formatDate(props.value.startDate)} — Select end date`
        : 'Select date range';

  const disabledDates: Matcher[] = [];
  if (props.min) disabledDates.push({ before: parseISO(props.min) });
  if (props.max) disabledDates.push({ after: parseISO(props.max) });

  function clearSelection() {
    if (props.mode === 'single') {
      props.onChange('');
    } else {
      props.onChange({ startDate: '', endDate: '' });
    }
    setOpen(false);
  }

  function selectSingle(value: Date | undefined) {
    if (!value || props.mode !== 'single') return;
    props.onChange(toDateKey(value));
    setOpen(false);
  }

  function selectRange(value: DateRange | undefined) {
    if (!value?.from || props.mode !== 'range') return;
    props.onChange({
      startDate: toDateKey(value.from),
      endDate: value.to ? toDateKey(value.to) : '',
    });
    if (value.to) setOpen(false);
  }

  const trigger = (
    <button
      type="button"
      className="date-picker__trigger"
      data-placeholder={selectedStart ? undefined : ''}
      data-readonly={props.readOnly ? '' : undefined}
      aria-label={props.ariaLabel ?? triggerText}
      aria-expanded={props.readOnly ? undefined : open}
      aria-required={props.required || undefined}
      disabled={props.disabled}
    >
      <CalendarDays className="size-4" aria-hidden="true" />
      <span>{triggerText}</span>
    </button>
  );

  if (props.readOnly) return trigger;

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      align="start"
      className={
        props.mode === 'range'
          ? 'date-picker-popover date-picker-popover--range rounded-lg border border-border-strong p-0 shadow-none'
          : 'date-picker-popover rounded-lg border border-border-strong p-0 shadow-none'
      }
      trigger={trigger}
    >
      <div className="date-picker" data-mode={props.mode}>
        {props.mode === 'single' ? (
          <Calendar
            mode="single"
            selected={fromDateKey(props.value)}
            defaultMonth={fromDateKey(props.value)}
            disabled={disabledDates}
            onSelect={selectSingle}
            showOutsideDays
            animate
          />
        ) : (
          <Calendar
            mode="range"
            selected={{
              from: fromDateKey(props.value.startDate),
              to: fromDateKey(props.value.endDate),
            }}
            defaultMonth={fromDateKey(props.value.startDate)}
            disabled={disabledDates}
            onSelect={selectRange}
            numberOfMonths={2}
            pagedNavigation
            showOutsideDays
            animate
          />
        )}

        <div className="date-picker__footer">
          <span>
            {props.mode === 'range' && selectedStart && !selectedEnd
              ? 'Choose an end date'
              : props.mode === 'range'
                ? 'Select a start and end date'
                : 'Choose one date'}
          </span>
          {selectedStart && !props.required ? (
            <button type="button" className="date-picker__clear" onClick={clearSelection}>
              Clear
            </button>
          ) : null}
        </div>
      </div>
    </Popover>
  );
}
