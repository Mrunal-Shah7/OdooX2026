import { type ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4 px-5 pt-6">
      <div>
        <h1 className="m-0 text-h1 font-semibold leading-tight tracking-tight">{title}</h1>
        {subtitle ? (
          <div className="m-0 mt-1 text-body-sm text-text-muted">{subtitle}</div>
        ) : null}
      </div>
      {actions ? <div className="flex gap-2">{actions}</div> : null}
    </div>
  );
}
