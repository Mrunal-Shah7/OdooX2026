import { type ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="mb-5 flex flex-col items-stretch justify-between gap-4 px-4 pt-5 sm:flex-row sm:items-start sm:px-5 sm:pt-6">
      <div className="min-w-0">
        <h1 className="m-0 text-h1 font-semibold leading-tight tracking-tight">{title}</h1>
        {subtitle ? (
          <div className="m-0 mt-1 text-body-sm text-text-muted">{subtitle}</div>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div> : null}
    </div>
  );
}
