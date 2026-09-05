import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { apiClient, ApiClientError } from '../../lib/apiClient';
import { useSession } from '../../lib/session';
import { BrandLogo } from '../../components/BrandLogo';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Card, CardBody } from '../../components/ui/Card';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await apiClient.login(email, password);
      setUser(user);
      await navigate({ to: '/profile' });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page min-h-screen">
      <section className="login-page__brand-panel" aria-labelledby="login-brand-title">
        <div className="login-page__brand-logo">
          <BrandLogo variant="full" />
        </div>
        <div className="login-page__brand-copy">
          <p className="login-page__eyebrow">People operations, connected</p>
          <h1 id="login-brand-title">One workspace for people, time, and payroll.</h1>
          <p>
            Give every team a clear view of employee information, attendance, time off,
            and payroll from one secure place.
          </p>
        </div>
      </section>

      <main className="login-page__access-panel">
        <div className="login-page__access-content">
          <Card className="login-page__sign-in-card">
            <CardBody>
              <h2 className="m-0 text-h1 font-semibold">Welcome back</h2>
              <p className="mt-1 text-body-sm text-text-muted">
                Sign in to continue to PeoplePay360.
              </p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <Field label="Email" htmlFor="email">
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Field>
                <Field label="Password" htmlFor="password">
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Field>
                {error ? (
                  <p className="login-page__error" role="alert">
                    {error}
                  </p>
                ) : null}
                <Button type="submit" variant="accent" className="w-full" disabled={loading}>
                  {loading ? 'Signing in…' : 'Sign in'}
                </Button>
              </form>
              <p className="mt-4 text-body-sm">
                <Link to="/forgot-password" className="text-accent">
                  Forgot password?
                </Link>
              </p>
            </CardBody>
          </Card>
        </div>
      </main>
    </div>
  );
}
