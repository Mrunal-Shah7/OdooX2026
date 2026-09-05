import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { apiClient, ApiClientError } from '../../lib/apiClient';
import { homePathForRole, useSession } from '../../lib/session';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Card, CardBody } from '../../components/ui/Card';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useSession();
  const [email, setEmail] = useState('admin@peoplepay360.test');
  const [password, setPassword] = useState('Demo@1234');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await apiClient.login(email, password);
      setUser(user);
      await navigate({ to: homePathForRole(user.role) });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-5">
      <Card className="w-full max-w-[var(--container-narrow)]">
        <CardBody>
          <h1 className="m-0 text-h1 font-semibold">Sign in</h1>
          <p className="mt-1 text-body-sm text-text-muted">PeoplePay360 demo environment</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Field label="Email" htmlFor="email">
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Field label="Password" htmlFor="password">
              <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </Field>
            {error ? <p className="text-body-sm text-danger">{error}</p> : null}
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
  );
}
