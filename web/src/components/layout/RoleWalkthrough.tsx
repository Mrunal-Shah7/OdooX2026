import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import type { UserRole } from '../../../../shared/constants';
import { can, CAPABILITY } from '../../lib/permissions';
import { useSession } from '../../lib/session';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const START_WALKTHROUGH_EVENT = 'peoplepay360:start-walkthrough';

export function startRoleWalkthrough() {
  window.dispatchEvent(new Event(START_WALKTHROUGH_EVENT));
}

type WalkthroughRoute =
  | '/profile'
  | '/attendance'
  | '/time-off'
  | '/time-off/requests'
  | '/time-off/types'
  | '/employees'
  | '/payroll'
  | '/payroll/payruns'
  | '/reports'
  | '/users';

type WalkthroughStep = {
  route: WalkthroughRoute;
  targetId: string;
  title: string;
  instruction: string;
};

type CoachmarkPosition = {
  top: number;
  left: number;
  placement: 'above' | 'below';
};

function stepsForRole(role: UserRole): WalkthroughStep[] {
  const steps: WalkthroughStep[] = [
    {
      route: '/profile',
      targetId: 'nav-attendance',
      title: 'Open attendance',
      instruction: 'The highlighted Attendance navigation opens your monthly records.',
    },
    {
      route: '/attendance',
      targetId: 'nav-time-off',
      title: 'Open time off',
      instruction: 'The highlighted Time off navigation opens balances, calendars, and leave dates.',
    },
    {
      route: '/time-off',
      targetId: 'timeoff-requests',
      title: 'Open requests',
      instruction: 'The highlighted Requests tab contains the leave requests available to your role.',
    },
  ];

  if (!can(role, CAPABILITY.crudEmployeesHr)) {
    steps.push({
      route: '/time-off/requests',
      targetId: 'nav-profile',
      title: 'Return to your profile',
      instruction: 'The highlighted profile icon returns you to your account overview.',
    });
    return steps;
  }

  steps.push({
    route: '/time-off/requests',
    targetId: 'timeoff-leave-types',
    title: 'Open leave types',
    instruction: 'The highlighted Leave types tab contains the available time-off policies.',
  });

  if (can(role, CAPABILITY.readPayrollDashboardReports)) {
    steps.push(
      {
        route: '/time-off/types',
        targetId: 'nav-payroll',
        title: 'Open payroll',
        instruction: 'The highlighted Payroll navigation opens the dashboard and period controls.',
      },
      {
        route: '/payroll',
        targetId: 'payroll-pay-runs',
        title: 'Open pay runs',
        instruction: 'The highlighted Pay runs tab is where payroll runs are reviewed and processed.',
      },
      {
        route: '/payroll/payruns',
        targetId: 'nav-reports',
        title: 'Open reports',
        instruction: 'The highlighted Reports navigation opens payroll and HR reporting views.',
      },
      {
        route: '/reports',
        targetId: 'nav-management',
        title: 'Open management',
        instruction: 'The highlighted Management navigation opens employee administration.',
      },
    );
  } else {
    steps.push({
      route: '/time-off/types',
      targetId: 'nav-management',
      title: 'Open management',
      instruction: 'The highlighted Management navigation opens employees, contracts, and schedules.',
    });
  }

  if (can(role, CAPABILITY.crudUsers)) {
    steps.push(
      {
        route: '/employees',
        targetId: 'management-users',
        title: 'Open user management',
        instruction: 'The highlighted User management tab contains accounts, roles, and access status.',
      },
      {
        route: '/users',
        targetId: 'nav-profile',
        title: 'Return to your profile',
        instruction: 'The highlighted profile icon returns you to your account overview.',
      },
    );
  } else {
    steps.push({
      route: '/employees',
      targetId: 'nav-profile',
      title: 'Return to your profile',
      instruction: 'The highlighted profile icon returns you to your account overview.',
    });
  }

  return steps;
}

function labelForRole(role: UserRole): string {
  return role
    .split('_')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

export function RoleWalkthrough() {
  const { user } = useSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const role = user?.role ?? 'employee';
  const steps = useMemo(() => stepsForRole(role), [role]);
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [coachmarkPosition, setCoachmarkPosition] = useState<CoachmarkPosition | null>(null);
  const coachmarkRef = useRef<HTMLElement>(null);
  const step = steps[stepIndex];
  const isOnExpectedRoute = pathname === step?.route;

  useEffect(() => {
    const start = () => {
      setStepIndex(0);
      setActive(true);
    };
    window.addEventListener(START_WALKTHROUGH_EVENT, start);
    return () => window.removeEventListener(START_WALKTHROUGH_EVENT, start);
  }, []);

  useEffect(() => {
    if (!active) return;

    const pageRegions = document.querySelectorAll<HTMLElement>('.top-nav, main');
    pageRegions.forEach((region) => {
      region.inert = true;
    });

    return () => {
      pageRegions.forEach((region) => {
        region.inert = false;
      });
    };
  }, [active]);

  useEffect(() => {
    if (!active || !step || !isOnExpectedRoute) {
      setTargetRect(null);
      setCoachmarkPosition(null);
      return;
    }

    let highlightedElement: Element | null = null;
    const updateTargetRect = () => {
      setTargetRect(highlightedElement?.getBoundingClientRect() ?? null);
    };
    const highlightTarget = () => {
      const nextElement = document.querySelector(
        `[data-walkthrough-id="${step.targetId}"]`,
      );
      if (highlightedElement === nextElement) return;
      highlightedElement?.classList.remove('walkthrough-target');
      highlightedElement = nextElement;
      highlightedElement?.classList.add('walkthrough-target');
      highlightedElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      updateTargetRect();
    };

    highlightTarget();
    const observer = new MutationObserver(highlightTarget);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
      highlightedElement?.classList.remove('walkthrough-target');
    };
  }, [active, isOnExpectedRoute, pathname, step]);

  useLayoutEffect(() => {
    const coachmark = coachmarkRef.current;
    if (!targetRect || !coachmark || !isOnExpectedRoute) return;

    const rootStyles = getComputedStyle(document.documentElement);
    const gap = Number.parseFloat(rootStyles.getPropertyValue('--space-3'));
    const viewportPadding = Number.parseFloat(rootStyles.getPropertyValue('--space-3'));
    const coachmarkRect = coachmark.getBoundingClientRect();
    const belowTop = targetRect.bottom + gap;
    const fitsBelow = belowTop + coachmarkRect.height <= window.innerHeight - viewportPadding;
    const placement = fitsBelow ? 'below' : 'above';
    const preferredTop = fitsBelow
      ? belowTop
      : targetRect.top - coachmarkRect.height - gap;
    const maximumTop = Math.max(
      viewportPadding,
      window.innerHeight - coachmarkRect.height - viewportPadding,
    );
    const top = Math.min(Math.max(viewportPadding, preferredTop), maximumTop);
    const preferredLeft = targetRect.left + targetRect.width / 2 - coachmarkRect.width / 2;
    const maximumLeft = Math.max(
      viewportPadding,
      window.innerWidth - coachmarkRect.width - viewportPadding,
    );
    const left = Math.min(Math.max(viewportPadding, preferredLeft), maximumLeft);

    setCoachmarkPosition({ top, left, placement });
  }, [isOnExpectedRoute, step, targetRect]);

  if (!active || !step) return null;

  const moveToStep = (nextIndex: number) => {
    const nextStep = steps[nextIndex];
    setStepIndex(nextIndex);
    void navigate({ to: nextStep.route });
  };

  const continueWalkthrough = () => {
    if (!isOnExpectedRoute) {
      void navigate({ to: step.route });
      return;
    }
    if (stepIndex === steps.length - 1) {
      setActive(false);
      setStepIndex(0);
      void navigate({ to: '/profile' });
      return;
    }
    moveToStep(stepIndex + 1);
  };

  return (
    <>
      <div className="walkthrough-backdrop" aria-hidden="true" />
      {targetRect && isOnExpectedRoute ? (
        <div
          className="walkthrough-spotlight"
          aria-hidden="true"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
          }}
        />
      ) : null}
      <aside
        ref={coachmarkRef}
        className="walkthrough-coachmark"
        role="dialog"
        aria-modal="true"
        aria-live="polite"
        data-awaiting-position={isOnExpectedRoute && !coachmarkPosition ? true : undefined}
        data-placement={coachmarkPosition?.placement}
        style={
          coachmarkPosition
            ? {
                top: coachmarkPosition.top,
                left: coachmarkPosition.left,
                right: 'auto',
                bottom: 'auto',
              }
            : undefined
        }
      >
        <div className="walkthrough-coachmark__meta">
          <Badge variant="info">{labelForRole(role)}</Badge>
          <span className="font-mono">
            {stepIndex + 1} / {steps.length}
          </span>
        </div>
        <h2>{step.title}</h2>
        <p>{step.instruction}</p>
        <div className="walkthrough-coachmark__actions">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setActive(false);
              setStepIndex(0);
            }}
          >
            End tour
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={stepIndex === 0}
            onClick={() => moveToStep(stepIndex - 1)}
          >
            Back
          </Button>
          <Button variant="accent" size="sm" onClick={continueWalkthrough}>
            {!isOnExpectedRoute
              ? 'Return to step'
              : stepIndex === steps.length - 1
                ? 'Finish'
                : 'Next'}
          </Button>
        </div>
      </aside>
    </>
  );
}
