import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AlertCircle, Check, KeyRound, X } from 'lucide-react';

import useAuth from '../hooks/useAuth';
import { changePasswordRequest } from '../api/auth';
import { getErrorMessage } from '../api/axios';
import homeFor from '../routes/homeFor';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

/** Mirrors the server rules in routes/authRoutes.js. */
const RULES = [
  { label: 'At least 8 characters', test: (value) => value.length >= 8 },
  { label: 'Contains a number', test: (value) => /\d/.test(value) },
];

const ChangePassword = () => {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const checks = RULES.map((rule) => ({
    ...rule,
    passed: rule.test(form.newPassword),
  }));

  const mismatch =
    form.confirmPassword.length > 0 && form.newPassword !== form.confirmPassword;

  const canSubmit =
    form.currentPassword &&
    checks.every((check) => check.passed) &&
    form.newPassword === form.confirmPassword;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await changePasswordRequest({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      // Re-fetch so mustChangePassword flips to false and the guard releases.
      const updated = await refreshUser();
      toast.success('Password changed');
      navigate(homeFor(updated ?? user), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600">
            <KeyRound className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">
            {user?.mustChangePassword ? 'Set a new password' : 'Change password'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {user?.mustChangePassword
              ? 'Choose your own password before continuing.'
              : 'Update the password for your account.'}
          </p>
          {/* Say whose session this is — otherwise a forced change on an
              unexpected account looks like the app is broken. */}
          {user?.email && (
            <p className="mt-2 text-xs text-slate-400">
              Signed in as <span className="text-slate-600">{user.email}</span>
            </p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="Current password"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              value={form.currentPassword}
              onChange={handleChange}
              required
            />

            <Input
              label="New password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              value={form.newPassword}
              onChange={handleChange}
              required
            />

            <ul className="space-y-1.5">
              {checks.map((check) => (
                <li
                  key={check.label}
                  className={`flex items-center gap-2 text-xs ${
                    check.passed ? 'text-emerald-600' : 'text-slate-500'
                  }`}
                >
                  {check.passed ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-slate-300" />
                  )}
                  {check.label}
                </li>
              ))}
            </ul>

            <Input
              label="Confirm new password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
              error={mismatch ? 'Passwords do not match' : ''}
              required
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={submitting}
              disabled={!canSubmit}
            >
              Update password
            </Button>
          </form>
        </div>

        {/* Escape hatch. Without this, landing here on an account whose
            password you don't know is a dead end — the guard blocks every
            other route, including /login. */}
        <p className="mt-4 text-center text-xs text-slate-500">
          Not your account?{' '}
          <button
            type="button"
            onClick={handleLogout}
            className="font-medium text-brand-600 hover:text-brand-700 hover:underline"
          >
            Log out and sign in as someone else
          </button>
        </p>
      </div>
    </div>
  );
};

export default ChangePassword;
