import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import { apiFetch } from '../../lib/apiFetch';
import { queryKeys } from '../../lib/queryKeys';
import { showToast } from '../../lib/toast';

const WEEKDAYS = [
  { dayOfWeek: 1, name: 'Monday' },
  { dayOfWeek: 2, name: 'Tuesday' },
  { dayOfWeek: 3, name: 'Wednesday' },
  { dayOfWeek: 4, name: 'Thursday' },
  { dayOfWeek: 5, name: 'Friday' },
  { dayOfWeek: 6, name: 'Saturday' },
  { dayOfWeek: 7, name: 'Sunday' },
];

type DayState = {
  enabled: boolean;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakHours: string;
};

type ScheduleDetail = {
  id: string;
  name: string;
  timezone: string;
  daysPerWeek: number;
  hoursPerWeek: string;
  active: boolean;
  employeeCount: number;
  days: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    breakHours: string;
    hours: string;
  }>;
};

export default function ScheduleFormPage() {
  const { id } = useParams({ strict: false }) as { id?: string };
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [active, setActive] = useState(true);

  const [days, setDays] = useState<DayState[]>(
    WEEKDAYS.map((w) => ({
      enabled: w.dayOfWeek <= 5,
      dayOfWeek: w.dayOfWeek,
      startTime: '09:00',
      endTime: '18:00',
      breakHours: '1.00',
    })),
  );

  const { data: scheduleData, isLoading } = useQuery({
    queryKey: queryKeys.schedules.detail(id ?? ''),
    queryFn: () => apiFetch<{ data: ScheduleDetail }>(`/working-schedules/${id}`),
    enabled: !isNew,
  });

  useEffect(() => {
    if (scheduleData?.data) {
      const s = scheduleData.data;
      setName(s.name);
      setActive(s.active);

      const mappedDays = WEEKDAYS.map((w) => {
        const existingDay = s.days.find((d) => d.dayOfWeek === w.dayOfWeek);
        if (existingDay) {
          return {
            enabled: true,
            dayOfWeek: w.dayOfWeek,
            startTime: existingDay.startTime,
            endTime: existingDay.endTime,
            breakHours: existingDay.breakHours,
          };
        }
        return {
          enabled: false,
          dayOfWeek: w.dayOfWeek,
          startTime: '09:00',
          endTime: '18:00',
          breakHours: '1.00',
        };
      });
      setDays(mappedDays);
    }
  }, [scheduleData]);

  const updateDay = (dayOfWeek: number, patch: Partial<DayState>) => {
    setDays((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d)),
    );
  };

  const calculateHours = (start: string, end: string, breakH: string) => {
    if (!start || !end) return 0;
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const totalMinutes = endH * 60 + endM - (startH * 60 + startM);
    const breakMinutes = (parseFloat(breakH) || 0) * 60;
    const workedMinutes = Math.max(0, totalMinutes - breakMinutes);
    return Math.max(0, workedMinutes / 60);
  };

  const totalWeeklyHours = days.reduce((sum, d) => {
    if (!d.enabled) return sum;
    return sum + calculateHours(d.startTime, d.endTime, d.breakHours);
  }, 0);

  const activeDaysCount = days.filter((d) => d.enabled).length;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) {
        throw new Error('Working schedule name is required.');
      }

      const activeDays = days
        .filter((d) => d.enabled)
        .map((d) => ({
          dayOfWeek: d.dayOfWeek,
          startTime: d.startTime,
          endTime: d.endTime,
          breakHours: d.breakHours,
        }));

      if (activeDays.length === 0) {
        throw new Error('At least one working day must be selected.');
      }

      for (const d of activeDays) {
        if (d.endTime <= d.startTime) {
          const dayName = WEEKDAYS.find((w) => w.dayOfWeek === d.dayOfWeek)?.name || 'day';
          throw new Error(`End time must be after start time on ${dayName}.`);
        }
      }

      const payload = {
        name,
        active,
        days: activeDays,
      };

      if (isNew) {
        return apiFetch<{ data: ScheduleDetail }>('/working-schedules', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } else {
        return apiFetch<{ data: ScheduleDetail }>(`/working-schedules/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      showToast({ type: 'success', title: 'Schedule Saved', message: `Working schedule "${name}" saved successfully.` });
      navigate({ to: '/schedules' });
    },
    onError: (err: any) => {
      const msg = err.message || 'Failed to save schedule';
      showToast({ type: 'error', title: 'Save Failed', message: msg });
    },
  });

  if (!isNew && isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={isNew ? 'New Working Schedule' : name}
        subtitle={`${activeDaysCount} days · ${totalWeeklyHours.toFixed(2)} hours per week`}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate({ to: '/schedules' })}>
              Cancel
            </Button>
            <Button
              variant="accent"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Saving...' : 'Save schedule'}
            </Button>
          </>
        }
      />
      <div className="px-5 pb-6 space-y-4">
        <Card>
          <CardBody className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Schedule Name">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Standard 40h"
                />
              </Field>

              <Field label="Status">
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="schedule-active"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="size-4 rounded border-border text-accent focus:ring-focus-ring"
                  />
                  <label htmlFor="schedule-active" className="text-body-sm font-medium text-text">
                    Active
                  </label>
                </div>
              </Field>
            </div>

            <div>
              <h3 className="text-label font-semibold text-text mb-3">Weekly Schedule Pattern</h3>
              <div className="overflow-x-auto border border-border rounded-md">
                <table className="w-full border-collapse text-body-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-sunken text-left text-label text-text-muted">
                      <th className="px-4 py-3 w-12">Working</th>
                      <th className="px-4 py-3">Day</th>
                      <th className="px-4 py-3">Start Time</th>
                      <th className="px-4 py-3">End Time</th>
                      <th className="px-4 py-3">Break (Hours)</th>
                      <th className="px-4 py-3 text-right font-mono">Daily Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {WEEKDAYS.map((w) => {
                      const dayState = days.find((d) => d.dayOfWeek === w.dayOfWeek)!;
                      const dailyHours = dayState.enabled
                        ? calculateHours(dayState.startTime, dayState.endTime, dayState.breakHours)
                        : 0;

                      return (
                        <tr key={w.dayOfWeek} className="border-b border-border hover:bg-surface-sunken/40">
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={dayState.enabled}
                              onChange={(e) => updateDay(w.dayOfWeek, { enabled: e.target.checked })}
                              className="size-4 rounded border-border text-accent"
                            />
                          </td>
                          <td className="px-4 py-3 font-medium text-text">{w.name}</td>
                          <td className="px-4 py-3">
                            <Input
                              type="time"
                              value={dayState.startTime}
                              onChange={(e) => updateDay(w.dayOfWeek, { startTime: e.target.value })}
                              disabled={!dayState.enabled}
                              className="w-32"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="time"
                              value={dayState.endTime}
                              onChange={(e) => updateDay(w.dayOfWeek, { endTime: e.target.value })}
                              disabled={!dayState.enabled}
                              className="w-32"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              step="0.5"
                              value={dayState.breakHours}
                              onChange={(e) => updateDay(w.dayOfWeek, { breakHours: e.target.value })}
                              disabled={!dayState.enabled}
                              className="w-24 font-mono"
                              numeric
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-medium">
                            {dayState.enabled ? dailyHours.toFixed(2) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
