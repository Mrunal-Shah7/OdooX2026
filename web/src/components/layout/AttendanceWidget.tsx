import { Popover } from '../ui/Popover';
import { Button } from '../ui/Button';

export function AttendanceWidget() {
  return (
    <Popover
      trigger={
        <Button variant="secondary" size="sm" className="border-primary-subtle bg-primary-hover text-on-primary">
          <span className="mr-2 inline-block size-2 rounded-full bg-success" />
          Checked in
        </Button>
      }
    >
      <div className="space-y-2 text-body-sm">
        <p className="m-0 font-mono text-caption text-text-muted">Today · 09:02</p>
        <p className="m-0">Attendance widget stub</p>
        <Button variant="accent" size="sm">
          Check out
        </Button>
      </div>
    </Popover>
  );
}
