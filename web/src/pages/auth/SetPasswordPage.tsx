import { useState, type FormEvent } from 'react';
import { Link, useSearch } from '@tanstack/react-router';
import { apiClient, ApiClientError } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Card, CardBody } from '../../components/ui/Card';

export default function SetPasswordPage() {
  const { token } = useSearch({ from: '/set-password' });
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setError(null);
    try {
      await apiClient.setPassword(token ?? '', password);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not set password');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-5">
      <Card className="w-full max-w-[var(--container-narrow)]">
        <CardBody>
          <h1 className="m-0 text-h1 font-semibold">Set password</h1>
          {done ? (
            <p className="mt-4 text-body-sm text-text-muted">
              Your password has been updated.{' '}
              <Link to="/login" className="text-accent">
                Sign in
              </Link>
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Field label="New password" htmlFor="password">
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
              </Field>
              <Field label="Confirm password" htmlFor="confirm">
                <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
              </Field>
              {error ? <p className="text-body-sm text-danger">{error}</p> : null}
              <Button type="submit" variant="accent">
                Save password
              </Button>
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
