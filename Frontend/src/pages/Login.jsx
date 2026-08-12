import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, GraduationCap, Lock, Mail } from 'lucide-react';

import useAuth from '../hooks/useAuth';
import { getErrorMessage } from '../api/axios';
import homeFor from '../routes/homeFor';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const Login = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Mirrors the server rules in routes/authRoutes.js. This is for feedback
  // only — the server still validates every request.
  const fieldErrors = {
    email: /^\S+@\S+\.\S+$/.test(form.email.trim())
      ? ''
      : 'A valid email is required',
    password: form.password ? '' : 'Password is required',
  };

  const isValid = !fieldErrors.email && !fieldErrors.password;

  // Already logged in? Don't show the form at all. An account still owing a
  // password change goes straight there, rather than to a dashboard the
  // guard would immediately bounce it away from.
  if (isAuthenticated) {
    return (
      <Navigate
        to={user.mustChangePassword ? '/change-password' : homeFor(user)}
        replace
      />
    );
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched(true);
    if (!isValid) return;

    setSubmitting(true);
    setError('');

    try {
      const loggedIn = await login(form);

      if (loggedIn.mustChangePassword) {
        navigate('/change-password', { replace: true });
        return;
      }

      // Send them back where they were headed, or to their dashboard.
      const destination = location.state?.from?.pathname || homeFor(loggedIn);
      navigate(destination, { replace: true });
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
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">InternTrack</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track intern progress in one place
          </p>
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
              label="Email"
              name="email"
              type="email"
              icon={Mail}
              autoComplete="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={handleChange}
              error={touched ? fieldErrors.email : ''}
              required
            />

            <Input
              label="Password"
              name="password"
              type="password"
              icon={Lock}
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              error={touched ? fieldErrors.password : ''}
              required
            />

            <Button type="submit" fullWidth size="lg" loading={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          Intern accounts are created by your admin.
        </p>
      </div>
    </div>
  );
};

export default Login;
