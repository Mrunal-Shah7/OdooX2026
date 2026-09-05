import { useMemo } from 'react';

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

export function YearCalendar({
  year,
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

  const hasPublicHolidays = useMemo(() => {
    return (days ?? []).some((d) => d.kind === 'holiday');
  }, [days]);

  const todayStr = '2026-09-05';

  return (
    <div className="space-y-4">
      {/* Legend at the top */}
      <div className="flex flex-wrap items-center gap-4 text-body-sm text-text-muted">
        {(types ?? []).length > 0 ? (
          (types ?? []).map((t) => (
            <span key={t.id} className="flex items-center gap-1.5">
              <span className="inline-block size-3 rounded-sm" style={{ background: t.color }} />
              <span>{t.name}</span>
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
          </>
        )}
        {hasPublicHolidays && (
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block size-3 rounded-sm border border-border-strong"
              style={{ background: 'var(--color-border-strong)' }}
            />
            <span>Public holiday</span>
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block size-3 rounded-sm"
            style={{ background: 'var(--color-surface-sunken)' }}
          />
          <span>Non-working</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-sm border-2 border-dashed border-text-muted" />
          <span>Pending approval</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-sm outline outline-2 outline-accent -outline-offset-1" />
          <span>Today</span>
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center font-mono text-caption">
          <thead>
            <tr className="border-b border-border bg-surface-sunken text-text-muted">
              <th className="w-12 px-2 py-1 text-left font-sans text-label font-medium"></th>
              {Array.from({ length: 37 }, (_, i) => (
                <th key={i} className="w-7 px-1 py-1 font-mono text-caption font-semibold">
                  {WEEKDAY_LETTERS[i % 7]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MONTH_NAMES.map((monthName, mIdx) => {
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

                    const dateStr = `${year}-${String(mIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const dayData = dayMap.get(dateStr);
                    const isToday = dateStr === todayStr;
                    const isSelected =
                      dateStr === selectedStartDate ||
                      dateStr === selectedEndDate ||
                      (selectedStartDate !== null &&
                        selectedEndDate !== null &&
                        dateStr > selectedStartDate &&
                        dateStr < selectedEndDate);

                    let bgClass = 'bg-surface hover:bg-surface-sunken';
                    let textClass = 'text-text';
                    let inlineStyle: React.CSSProperties | undefined;
                    let extraClasses = '';

                    if (dayData) {
                      if (dayData.kind === 'non_working') {
                        bgClass = 'bg-surface-sunken text-text-subtle';
                      } else if (dayData.kind === 'holiday') {
                        bgClass = 'bg-border-strong/25 border border-border-strong font-semibold';
                      } else if (dayData.kind === 'leave') {
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
                      }
                    }

                    return (
                      <td key={dIdx} className="p-0.5">
                        <div
                          role={onDateClick ? 'button' : undefined}
                          tabIndex={onDateClick ? 0 : undefined}
                          title={`${dateStr}${dayData?.label ? `: ${dayData.label}` : ` (${dayData?.kind ?? 'working'})`}${dayData?.isPending ? ' (Pending)' : ''}`}
                          style={inlineStyle}
                          onClick={onDateClick ? () => onDateClick(dateStr) : undefined}
                          onKeyDown={
                            onDateClick
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
                          } ${isSelected ? 'ring-2 ring-accent ring-inset cursor-pointer' : onDateClick ? 'cursor-pointer' : ''}`}
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
