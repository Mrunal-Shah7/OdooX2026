import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../lib/session';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Popover } from '../ui/Popover';

type ActiveAttendance = {
  checkedIn: boolean;
  record: {
    id: string;
    date: string;
    checkIn: string | null;
    checkOut: string | null;
    workedHours: string;
    overtimeHours: string;
    status: string;
  } | null;
  todayWorkedHours: string;
};

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  const userId = sessionStorage.getItem('pp360_user_id');
  if (userId) {
    headers.set('x-user-id', userId);
  }
  const res = await fetch(path, { ...options, headers, credentials: 'include' });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message ?? 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  const json = await res.json();
  return json.data;
}

export function AttendanceWidget() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [elapsed, setElapsed] = useState('00:00');

  const { data: active, isLoading } = useQuery<ActiveAttendance>({
    queryKey: ['attendance', 'active'],
    queryFn: () => apiRequest<ActiveAttendance>('/api/attendance/active'),
    enabled: !!user?.employee,
    refetchInterval: 30000,
  });

  const checkInMutation = useMutation({
    mutationFn: () => apiRequest('/api/attendance/check-in', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setOpen(false);
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: () => apiRequest('/api/attendance/check-out', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setOpen(false);
    },
  });

  // Calculate live elapsed time if checked in
  useEffect(() => {
    if (!active?.checkedIn || !active.record?.checkIn) {
      return;
    }

    const checkInTime = new Date(active.record.checkIn).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((now - checkInTime) / 1000));
      const hours = Math.floor(diffSec / 3600);
      const minutes = Math.floor((diffSec % 3600) / 60);
      setElapsed(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [active?.checkedIn, active?.record?.checkIn]);

  if (!user?.employee) {
    return null;
  }

  const isCheckedIn = active?.checkedIn ?? false;
  const checkInDisplay = active?.record?.checkIn
    ? new Date(active.record.checkIn).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    : '—';

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger={
        <button
          type="button"
          className="flex h-9 items-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-body-sm text-text transition-colors hover:bg-surface-sunken focus:outline-none focus:ring-2 focus:ring-focus-ring"
        >
          <span
            className={`inline-block size-2 rounded-full ${
              isCheckedIn ? 'bg-success' : 'bg-text-muted'
            }`}
          />
          <span className="font-medium">{isCheckedIn ? 'Checked in' : 'Check in'}</span>
          <span className="text-text-muted">·</span>
          <span className="text-text-subtle font-mono text-caption">
            {isCheckedIn ? elapsed : '0.00h'}
          </span>
        </button>
      }
    >
      <div className="w-64 space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <span className="font-medium text-text">
            {user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : 'Welcome'}
          </span>
          <Badge variant={isCheckedIn ? 'success' : 'neutral'}>
            {isCheckedIn ? 'open' : 'off duty'}
          </Badge>
        </div>

        {isCheckedIn ? (
          <>
            <div className="flex justify-between text-body-sm">
              <span className="text-text-muted">Checked in</span>
              <span className="font-mono text-caption text-text">{checkInDisplay}</span>
            </div>
            <div className="text-center">
              <div className="font-mono text-h1 font-semibold text-text">{elapsed}</div>
              <span className="font-mono text-caption text-text-muted">elapsed today</span>
            </div>
            <div className="flex justify-between text-body-sm">
              <span className="text-text-muted">Worked hours</span>
              <span className="font-mono text-caption text-text">
                {active?.todayWorkedHours ?? '0.00'} h
              </span>
            </div>
            <Button
              variant="accent"
              className="w-full"
              disabled={checkOutMutation.isPending}
              onClick={() => checkOutMutation.mutate()}
            >
              {checkOutMutation.isPending ? 'Checking out...' : 'Check out'}
            </Button>
          </>
        ) : (
          <>
            <p className="text-body-sm text-text-muted">
              You are currently checked out. Click below to start recording attendance for today.
            </p>
            {active?.record && (
              <div className="flex justify-between text-body-sm">
                <span className="text-text-muted">Completed today</span>
                <span className="font-mono text-caption text-text">
                  {active.todayWorkedHours} h
                </span>
              </div>
            )}
            <Button
              variant="accent"
              className="w-full"
              disabled={checkInMutation.isPending || isLoading}
              onClick={() => checkInMutation.mutate()}
            >
              {checkInMutation.isPending ? 'Checking in...' : 'Check in'}
            </Button>
          </>
        )}
      </div>
    </Popover>
  );
}
