import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Lock, Mail } from 'lucide-react';

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
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-[1.15fr_1fr]">
      {/* Brand panel — the design's split hero */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-(--color-divider) p-14 lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-[-40%] right-[-60%] h-195 w-195 rounded-full blur-lg"
          style={{
            background:
              'radial-gradient(circle, rgba(145,132,217,.20), transparent 62%)',
          }}
        />

        <div className="relative flex items-center gap-2.5">
          <div className="grid h-5.5 w-5.5 place-items-center rounded-md border border-(--color-accent)">
            <div
              className="h-1.5 w-1.5 rounded-xs bg-(--color-accent)"
              style={{ boxShadow: '0 0 10px var(--color-accent)' }}
            />
          </div>
          <span className="text-[17px] tracking-tight text-slate-900">
            InternTrack
          </span>
          <span className="ml-1.5 pt-0.5 text-[10px] tracking-[0.14em] text-slate-400 uppercase">
            Intern operations
          </span>
        </div>

        <div className="relative max-w-155">
          <h1 className="text-[clamp(40px,4.4vw,64px)] leading-[1.03] font-medium tracking-[-0.03em] text-balance text-slate-900">
            Every intern,
            <br />
            every milestone,
            <br />
            one ledger.
          </h1>
          <p className="mt-5 max-w-[46ch] text-base leading-relaxed text-pretty text-slate-500">
            Track intern progress in one place — onboarding, task assignment,
            submissions and feedback against real deadlines.
          </p>
        </div>

        <div className="relative text-[11px] tracking-[0.08em] text-slate-400 uppercase">
          Secured workspace
        </div>
      </div>

      {/* Form panel */}
      <div className="grid place-items-center p-6 sm:p-12">
        <div className="w-full max-w-90">
          {/* Compact brand for narrow screens, where the panel is hidden */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="grid h-5.5 w-5.5 place-items-center rounded-md border border-(--color-accent)">
              <div
                className="h-1.5 w-1.5 rounded-xs bg-(--color-accent)"
                style={{ boxShadow: '0 0 10px var(--color-accent)' }}
              />
            </div>
            <span className="text-[17px] tracking-tight text-slate-900">
              InternTrack
            </span>
          </div>

          <div className="mb-2.5 text-[11px] tracking-[0.14em] text-(--color-accent-300) uppercase">
            Sign in
          </div>
          <h2 className="text-[30px] tracking-[-0.02em] text-slate-900">
            Welcome back.
          </h2>
          <p className="mt-1.5 mb-7 text-sm text-slate-500">
            Use your work account to continue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 " noValidate>
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border  border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="Work email"
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

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={submitting}
              className="mt-2"
            >
              {submitting ? 'Signing in…' : 'Continue'}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-400">
            Intern accounts are created by your admin.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
