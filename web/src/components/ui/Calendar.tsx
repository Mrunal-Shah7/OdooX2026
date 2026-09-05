import {
  DayPicker,
  type DayPickerProps,
  type ChevronProps,
} from 'react-day-picker';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/cn';

export type CalendarProps = DayPickerProps;

export function Calendar({
  className,
  classNames,
  components,
  showOutsideDays = true,
  navLayout = 'around',
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      navLayout={navLayout}
      className={cn('shadcn-calendar', className)}
      classNames={{
        root: cn('shadcn-calendar__root', classNames?.root),
        months: cn('shadcn-calendar__months', classNames?.months),
        month: cn('shadcn-calendar__month', classNames?.month),
        nav: cn('shadcn-calendar__nav', classNames?.nav),
        button_previous: cn(
          'shadcn-calendar__nav-button shadcn-calendar__nav-button--previous',
          classNames?.button_previous,
        ),
        button_next: cn(
          'shadcn-calendar__nav-button shadcn-calendar__nav-button--next',
          classNames?.button_next,
        ),
        month_caption: cn('shadcn-calendar__month-caption', classNames?.month_caption),
        caption_label: cn('shadcn-calendar__caption-label', classNames?.caption_label),
        month_grid: cn('shadcn-calendar__month-grid', classNames?.month_grid),
        weekdays: cn('shadcn-calendar__weekdays', classNames?.weekdays),
        weekday: cn('shadcn-calendar__weekday', classNames?.weekday),
        week: cn('shadcn-calendar__week', classNames?.week),
        day: cn('shadcn-calendar__day', classNames?.day),
        day_button: cn('shadcn-calendar__day-button', classNames?.day_button),
        today: cn('shadcn-calendar__today', classNames?.today),
        outside: cn('shadcn-calendar__outside', classNames?.outside),
        disabled: cn('shadcn-calendar__disabled', classNames?.disabled),
        selected: cn('shadcn-calendar__selected', classNames?.selected),
        range_start: cn('shadcn-calendar__range-start', classNames?.range_start),
        range_middle: cn('shadcn-calendar__range-middle', classNames?.range_middle),
        range_end: cn('shadcn-calendar__range-end', classNames?.range_end),
        hidden: cn('shadcn-calendar__hidden', classNames?.hidden),
        caption_after_enter: cn(
          'shadcn-calendar__caption-enter',
          classNames?.caption_after_enter,
        ),
        caption_before_enter: cn(
          'shadcn-calendar__caption-enter',
          classNames?.caption_before_enter,
        ),
        caption_after_exit: cn(
          'shadcn-calendar__caption-exit',
          classNames?.caption_after_exit,
        ),
        caption_before_exit: cn(
          'shadcn-calendar__caption-exit',
          classNames?.caption_before_exit,
        ),
        weeks_after_enter: cn('shadcn-calendar__weeks-enter', classNames?.weeks_after_enter),
        weeks_before_enter: cn('shadcn-calendar__weeks-enter', classNames?.weeks_before_enter),
        weeks_after_exit: cn('shadcn-calendar__weeks-exit', classNames?.weeks_after_exit),
        weeks_before_exit: cn('shadcn-calendar__weeks-exit', classNames?.weeks_before_exit),
      }}
      components={{
        Chevron: CalendarChevron,
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarChevron({ className, orientation }: ChevronProps) {
  const iconClassName = cn('size-4', className);
  if (orientation === 'right') {
    return <ChevronRight className={iconClassName} aria-hidden="true" />;
  }
  if (orientation === 'up') {
    return <ChevronUp className={iconClassName} aria-hidden="true" />;
  }
  if (orientation === 'down') {
    return <ChevronDown className={iconClassName} aria-hidden="true" />;
  }
  return <ChevronLeft className={iconClassName} aria-hidden="true" />;
}
