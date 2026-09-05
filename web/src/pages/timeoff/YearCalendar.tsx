import { useMemo } from 'react';
import { Skeleton } from '../../components/ui/Skeleton';

export type TimeOffCalendarDay = {
  date: string;
  kind: 'working' | 'non_working' | 'holiday' | 'leave';
  timeOffTypeId: string | null;
  color: string | null;
  fraction: string;
  label: string | null;
  isPending?: boolean;
};

type YearCalendarProps = {
  year: number;
  selectedMonth?: number;
  days: TimeOffCalendarDay[];
  types?: { id: string; name: string; color: string }[];
  selectedStartDate?: string | null;
  selectedEndDate?: string | null;
  onDateClick?: (date: string) => void;
};

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function YearCalendarSkeleton({ selectedMonth }: { selectedMonth?: number }) {
  const rowCount = selectedMonth ? 1 : 12;

  return (
    <div className="timeoff-calendar-skeleton space-y-4" role="status" aria-label="Loading calendar">
      <div className="timeoff-calendar-skeleton__legend">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} />
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center font-mono text-caption">
          <thead>
            <tr className="border-b border-border bg-surface-sunken">
              <th className="w-12 px-2 py-1" />
              {Array.from({ length: 37 }, (_, index) => (
                <th key={index} className="w-7 px-1 py-1">
                  <Skeleton className="timeoff-calendar-skeleton__day" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rowCount }, (_, rowIndex) => (
              <tr key={rowIndex} className="border-b border-border">
                <td className="px-2 py-1">
                  <Skeleton className="timeoff-calendar-skeleton__month" />
                </td>
                {Array.from({ length: 37 }, (_, dayIndex) => (
                  <td key={dayIndex} className="p-0.5">
                    <Skeleton className="timeoff-calendar-skeleton__day" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function YearCalendar({
  year,
  selectedMonth,
  days = [],
  types = [],
  selectedStartDate = null,
  selectedEndDate = null,
  onDateClick,
}: YearCalendarProps) {
  const dayMap = useMemo(() => {
    const map = new Map<string, TimeOffCalendarDay>();
    for (const d of (days ?? [])) {
      map.set(d.date, d);
    }
    return map;
  }, [days]);

  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  return (
    <div className="space-y-4">
      {/* Legend at the top */}
      <div className="flex flex-wrap items-center gap-4 text-body-sm text-text-muted">
        {(types ?? []).length > 0 ? (
          (types ?? []).map((t) => (
            <span key={t.id} className="flex items-center gap-1.5">
              <span className="inline-block size-3 rounded-sm" style={{ background: t.color }} />
              <span>{t.name} (approved)</span>
            </span>
          ))
        ) : (
          <>
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block size-3 rounded-sm"
                style={{ background: 'var(--color-chart-1)' }}
              />
              <span>Paid Time Off</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block size-3 rounded-sm"
                style={{ background: 'var(--color-chart-5)' }}
              />
              <span>Sick Leave</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block size-3 rounded-sm"
                style={{ background: 'var(--color-chart-4)' }}
              />
              <span>Comp Off</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block size-3 rounded-sm"
                style={{ background: 'var(--color-chart-3)' }}
              />
              <span>Unpaid Leave</span>
            </span>
          </>
        )}
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block size-3 rounded-sm border border-border-strong"
            style={{ background: 'var(--color-border-strong)' }}
          />
          <span>Public holiday</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block size-3 rounded-sm"
            style={{ background: 'var(--color-surface-sunken)' }}
          />
          <span>Non-working (Sat / Sun)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-sm border-2 border-dashed border-text-muted" />
          <span>Pending approval</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-sm outline outline-2 outline-accent -outline-offset-1" />
          <span>Today</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-sm bg-accent/20 ring-1 ring-accent" />
          <span>Selected range</span>
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center font-mono text-caption">
          <thead>
            <tr className="border-b border-border bg-surface-sunken text-text-muted">
              <th className="w-12 px-2 py-1 text-left font-sans text-label font-medium"></th>
              {Array.from({ length: 37 }, (_, i) => {
                const isWeekendCol = i % 7 === 5 || i % 7 === 6;
                return (
                  <th
                    key={i}
                    className={`w-7 px-1 py-1 font-mono text-caption font-semibold ${
                      isWeekendCol ? 'text-text-subtle' : ''
                    }`}
                  >
                    {WEEKDAY_LETTERS[i % 7]}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {MONTH_NAMES.map((monthName, mIdx) => {
              if (selectedMonth && mIdx + 1 !== selectedMonth) return null;
              const daysInMonth = new Date(year, mIdx + 1, 0).getDate();
              return (
                <tr key={monthName} className="border-b border-border">
                  <td className="px-2 py-1 text-left font-sans text-label font-medium text-text-muted">
                    {monthName}
                  </td>
                  {Array.from({ length: 37 }, (_, dIdx) => {
                    const firstDayOfMonth = new Date(year, mIdx, 1);
                    // 0 is Sunday, 1 is Monday... map to 0=Mon, ..., 6=Sun
                    const offset = (firstDayOfMonth.getDay() + 6) % 7;
                    const dayNum = dIdx - offset + 1;

                    if (dayNum < 1 || dayNum > daysInMonth) {
                      return <td key={dIdx} className="p-0.5 bg-canvas/30" />;
                    }

                    const isWeekend = dIdx % 7 === 5 || dIdx % 7 === 6;
                    const dateStr = `${year}-${String(mIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const dayData = dayMap.get(dateStr);
                    const isHoliday = dayData?.kind === 'holiday';
                    const isNonWorking = isWeekend || dayData?.kind === 'non_working';
                    const isOffDay = isWeekend || isHoliday || isNonWorking;

                    const isToday = dateStr === todayStr;
                    const isSelected =
                      !isOffDay &&
                      (dateStr === selectedStartDate ||
                        dateStr === selectedEndDate ||
                        (selectedStartDate !== null &&
                          selectedEndDate !== null &&
                          dateStr > selectedStartDate &&
                          dateStr < selectedEndDate));

                    let bgClass = 'bg-surface hover:bg-surface-sunken';
                    let textClass = 'text-text';
                    let inlineStyle: React.CSSProperties | undefined;
                    let extraClasses = '';

                    if (dayData?.kind === 'leave') {
                      if (dayData.isPending) {
                        inlineStyle = {
                          borderColor: dayData.color ?? 'var(--color-chart-1)',
                          color: dayData.color ?? 'var(--color-chart-1)',
                        };
                        bgClass = 'bg-surface';
                        extraClasses = 'border-2 border-dashed font-semibold opacity-80';
                      } else if (dayData.fraction === '0.50') {
                        inlineStyle = {
                          background: `linear-gradient(135deg, ${
                            dayData.color ?? 'var(--color-chart-1)'
                          } 50%, transparent 50%)`,
                        };
                      } else {
                        inlineStyle = {
                          backgroundColor: dayData.color ?? 'var(--color-chart-1)',
                          color: '#ffffff',
                        };
                        textClass = 'text-on-primary font-medium';
                      }
                    } else if (isHoliday) {
                      bgClass = 'bg-border-strong/25 border border-border-strong font-semibold';
                    } else if (isNonWorking) {
                      bgClass = 'bg-surface-sunken text-text-subtle';
                    }

                    const canClick = !!onDateClick && !isOffDay;

                    let titleText = `${dateStr}${dayData?.label ? `: ${dayData.label}` : isWeekend ? ' (Weekend)' : ' (Working day)'}`;
                    if (isHoliday && dayData?.label) titleText = `${dateStr}: ${dayData.label} (Public holiday)`;
                    else if (isHoliday) titleText += ' (Public holiday)';
                    if (dayData?.isPending) titleText += ' (Pending)';

                    return (
                      <td key={dIdx} className="p-0.5">
                        <div
                          role={canClick ? 'button' : undefined}
                          tabIndex={canClick ? 0 : undefined}
                          title={titleText}
                          style={inlineStyle}
                          onClick={canClick ? () => onDateClick(dateStr) : undefined}
                          onKeyDown={
                            canClick
                              ? (event) => {
                                  if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    onDateClick(dateStr);
                                  }
                                }
                              : undefined
                          }
                          className={`flex h-6 w-6 items-center justify-center rounded-sm font-mono text-[11px] transition-colors ${bgClass} ${textClass} ${extraClasses} ${
                            isToday ? 'outline outline-2 outline-accent -outline-offset-1 font-bold' : ''
                          } ${isSelected ? 'bg-accent/20 text-accent font-semibold ring-1 ring-accent ring-inset cursor-pointer' : canClick ? 'cursor-pointer' : isOffDay ? 'cursor-not-allowed opacity-80' : ''}`}
                        >
                          {dayNum}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
