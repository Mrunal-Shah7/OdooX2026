import { useState, type FormEvent } from 'react';
import { Link } from '@tanstack/react-router';
import { apiClient } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Card, CardBody } from '../../components/ui/Card';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.requestPasswordReset(email);
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-5">
      <Card className="w-full max-w-[var(--container-narrow)]">
        <CardBody>
          <p className="m-0 text-h2 font-semibold">PeoplePay360</p>
          <h1 className="m-0 mt-4 text-h1 font-semibold">Forgot password</h1>
          {submitted ? (
            <p className="mt-4 text-body-sm text-text-muted">
              If that address has an account, a link is on its way.
            </p>
          ) : (
            <>
              <p className="mt-1 text-body-sm text-text-muted">
                Enter your work email and we will send a reset link.
              </p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <Field label="Work email" htmlFor="email">
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@peoplepay360.test"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Field>
                <Button type="submit" variant="accent" className="w-full" disabled={loading}>
                  {loading ? 'Sending…' : 'Send reset link'}
                </Button>
              </form>
            </>
          )}
          <p className="mt-4 text-body-sm">
            <Link to="/login" className="text-accent">
              Back to sign in
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
