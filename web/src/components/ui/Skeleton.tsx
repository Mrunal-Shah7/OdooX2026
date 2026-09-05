import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';
import { BrandLogo } from '../BrandLogo';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('skeleton', className)} aria-hidden="true" {...props} />;
}

export function PageSkeleton() {
  return (
    <div className="page-skeleton" role="status" aria-label="Loading page">
      <div className="page-skeleton__header">
        <Skeleton className="skeleton--title" />
        <Skeleton className="skeleton--text" />
      </div>
      <div className="page-skeleton__metrics">
        <Skeleton className="skeleton--metric" />
        <Skeleton className="skeleton--metric" />
        <Skeleton className="skeleton--metric" />
      </div>
      <Skeleton className="skeleton--panel" />
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="page-skeleton" role="status" aria-label="Loading form">
      <div className="page-skeleton__header">
        <Skeleton className="skeleton--title" />
        <Skeleton className="skeleton--text" />
      </div>
      <div className="form-skeleton__layout">
        <div className="form-skeleton__card">
          <Skeleton className="skeleton--heading" />
          <div className="form-skeleton__fields">
            <Skeleton className="skeleton--control" />
            <Skeleton className="skeleton--control" />
            <Skeleton className="skeleton--control" />
            <Skeleton className="skeleton--control" />
            <Skeleton className="skeleton--control" />
            <Skeleton className="skeleton--control" />
          </div>
        </div>
        <Skeleton className="skeleton--side-panel" />
      </div>
    </div>
  );
}

export function AuthSkeleton() {
  return (
    <div className="login-page auth-skeleton min-h-screen" role="status" aria-label="Checking your session">
      <section className="login-page__brand-panel auth-skeleton__brand-panel">
        <div className="login-page__brand-logo">
          <BrandLogo variant="full" />
        </div>
        <div className="auth-skeleton__brand-copy">
          <Skeleton className="skeleton--text skeleton--on-primary" />
          <Skeleton className="skeleton--title skeleton--on-primary" />
          <Skeleton className="skeleton--text skeleton--on-primary" />
          <Skeleton className="skeleton--text skeleton--on-primary" />
        </div>
      </section>
      <main className="login-page__access-panel">
        <div className="login-page__access-content">
          <div className="auth-skeleton__card">
            <Skeleton className="skeleton--heading" />
            <Skeleton className="skeleton--text" />
            <Skeleton className="skeleton--control" />
            <Skeleton className="skeleton--control" />
            <Skeleton className="skeleton--button" />
          </div>
        </div>
      </main>
    </div>
  );
}
