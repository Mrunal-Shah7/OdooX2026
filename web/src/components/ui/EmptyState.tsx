import { type ReactNode } from 'react';

type EmptyStateProps = {
  title?: string;
  message?: string;
  action?: ReactNode;
};

export function EmptyState({
  title = 'Nothing here yet',
  message = 'No records match your filters.',
  action,
}: EmptyStateProps) {
  return (
    <div className="px-5 py-8 text-center">
      <h3 className="m-0 text-h3 font-semibold text-text">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-text-muted">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
