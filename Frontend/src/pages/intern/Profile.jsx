import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  Check,
  KeyRound,
  Lock,
  Save,
  X,
} from 'lucide-react';

import { fetchMyProfile, updateMyProfile } from '../../api/interns';
import { changePasswordRequest } from '../../api/auth';
import { getErrorMessage } from '../../api/axios';
import useAuth from '../../hooks/useAuth';

import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton, { SkeletonCard } from '../../components/ui/Skeleton';

const STATUS_TONES = {
  active: 'emerald',
  completed: 'blue',
  terminated: 'red',
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

/** Admin-owned fields: shown, never editable here (PROJECT_PLAN.md §9). */
const ReadOnlyField = ({ label, value }) => (
  <div>
    <label className="mb-1.5 block text-sm font-medium text-slate-700">
      {label}
    </label>
    <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
      <span className="truncate">{value || '—'}</span>
    </div>
  </div>
);

/** Mirrors the server rules in routes/authRoutes.js. */
const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (value) => value.length >= 8 },
  { label: 'Contains a number', test: (value) => /\d/.test(value) },
];

const isValidUrl = (value) => {
  if (!value.trim()) return true;
  try {
    new URL(value.trim());
    return true;
  } catch {
    return false;
  }
};

/**
 * The three editable fields (PROJECT_PLAN.md §9).
 *
 * Its initial state is seeded from the profile prop, and the parent gives it a
 * `key` derived from those same values — so when the server returns different
 * data the component remounts with it, instead of syncing via an effect.
 */
const DetailsForm = ({ profile, onSave, saving, error, onDismissError }) => {
  const [form, setForm] = useState({
    phone: profile.phone ?? '',
    university: profile.university ?? '',
    avatarUrl: profile.avatarUrl ?? '',
  });

  const avatarError = isValidUrl(form.avatarUrl)
    ? ''
    : 'Enter a full URL, e.g. https://example.com/me.jpg';

  const isDirty =
    form.phone !== (profile.phone ?? '') ||
    form.university !== (profile.university ?? '') ||
    form.avatarUrl !== (profile.avatarUrl ?? '');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    onDismissError();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (avatarError) return;

    // Only the three permitted fields are ever sent. Empty strings are sent
    // deliberately — that is how the server is told to clear a field. Sending
    // undefined would drop the key and the old value would survive.
    onSave({
      phone: form.phone.trim(),
      university: form.university.trim(),
      avatarUrl: form.avatarUrl.trim(),
    });
  };

  const resetForm = () =>
    setForm({
      phone: profile.phone ?? '',
      university: profile.university ?? '',
      avatarUrl: profile.avatarUrl ?? '',
    });

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        <Input
          label="Phone"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="0300 1234567"
        />
        <Input
          label="University"
          name="university"
          value={form.university}
          onChange={handleChange}
          placeholder="NUST"
        />
        <Input
          label="Avatar URL"
          name="avatarUrl"
          value={form.avatarUrl}
          onChange={handleChange}
          error={avatarError}
          placeholder="https://example.com/photo.jpg"
          hint="Leave empty to keep using your initials."
        />
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button
          variant="secondary"
          onClick={resetForm}
          disabled={!isDirty || saving}
        >
          Reset
        </Button>
        <Button
          type="submit"
          icon={Save}
          loading={saving}
          disabled={!isDirty || Boolean(avatarError)}
        >
          Save changes
        </Button>
      </div>
    </form>
  );
};

const Profile = () => {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();

  // Every value on this page comes from this request — no mock data anywhere.
  const {
    data: profile,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['my-profile'],
    queryFn: fetchMyProfile,
  });

  const [formError, setFormError] = useState('');

  const updateMutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: async () => {
      // Re-read from the server so what's displayed is what was stored,
      // and refresh the auth user so the sidebar avatar/name update too.
      await queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      await refreshUser();
      setFormError('');
      toast.success('Profile updated');
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  /* ---------------- password change ---------------- */

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');

  const checks = PASSWORD_RULES.map((rule) => ({
    ...rule,
    passed: rule.test(passwords.newPassword),
  }));

  const mismatch =
    passwords.confirmPassword.length > 0 &&
    passwords.newPassword !== passwords.confirmPassword;

  const canChangePassword =
    passwords.currentPassword &&
    checks.every((check) => check.passed) &&
    passwords.newPassword === passwords.confirmPassword;

  const passwordMutation = useMutation({
    mutationFn: changePasswordRequest,
    onSuccess: () => {
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordError('');
      toast.success('Password changed');
    },
    onError: (err) => setPasswordError(getErrorMessage(err)),
  });

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswords((previous) => ({ ...previous, [name]: value }));
    setPasswordError('');
  };

  const handlePasswordSubmit = (event) => {
    event.preventDefault();
    if (!canChangePassword) return;
    passwordMutation.mutate({
      currentPassword: passwords.currentPassword,
      newPassword: passwords.newPassword,
    });
  };

  /* ---------------- render ---------------- */

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <EmptyState
          title="Couldn't load your profile"
          message={getErrorMessage(error)}
          action={
            <Button
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ['my-profile'] })
              }
            >
              Try again
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Identity header — all values straight from the API */}
      <Card>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Avatar name={profile.name} src={profile.avatarUrl} size="xl" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold text-slate-900">
                {profile.name}
              </h2>
              <Badge tone={STATUS_TONES[profile.status]} dot>
                <span className="capitalize">{profile.status}</span>
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              {profile.position || 'Intern'}
              {profile.department ? ` · ${profile.department}` : ''}
            </p>
            <p className="mt-0.5 text-sm text-slate-500">{profile.email}</p>
          </div>
        </div>
      </Card>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        {/* Editable fields */}
        <Card>
          <CardHeader
            title="Your details"
            subtitle="The only fields you can change yourself."
          />

          <DetailsForm
            key={`${profile.phone ?? ''}|${profile.university ?? ''}|${
              profile.avatarUrl ?? ''
            }`}
            profile={profile}
            saving={updateMutation.isPending}
            error={formError}
            onDismissError={() => setFormError('')}
            onSave={(values) => updateMutation.mutate(values)}
          />
        </Card>

        <div className="space-y-4">
          {/* Admin-owned, read only */}
          <Card>
            <CardHeader
              title="Placement details"
              subtitle="Managed by your admin — contact them if something is wrong."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <ReadOnlyField label="Email" value={profile.email} />
              <ReadOnlyField label="Department" value={profile.department} />
              <ReadOnlyField label="Position" value={profile.position} />
              <ReadOnlyField
                label="Status"
                value={
                  profile.status
                    ? profile.status[0].toUpperCase() + profile.status.slice(1)
                    : ''
                }
              />
              <ReadOnlyField
                label="Start date"
                value={formatDate(profile.startDate)}
              />
              <ReadOnlyField
                label="End date"
                value={formatDate(profile.endDate)}
              />
            </div>
          </Card>

          {/* Password */}
          <Card>
            <CardHeader
              title="Change password"
              subtitle="Use at least 8 characters, including a number."
            />

            <form onSubmit={handlePasswordSubmit} noValidate>
              {passwordError && (
                <div
                  role="alert"
                  className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="space-y-4">
                <Input
                  label="Current password"
                  name="currentPassword"
                  type="password"
                  icon={Lock}
                  autoComplete="current-password"
                  value={passwords.currentPassword}
                  onChange={handlePasswordChange}
                />
                <Input
                  label="New password"
                  name="newPassword"
                  type="password"
                  icon={KeyRound}
                  autoComplete="new-password"
                  value={passwords.newPassword}
                  onChange={handlePasswordChange}
                />

                {passwords.newPassword.length > 0 && (
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
                )}

                <Input
                  label="Confirm new password"
                  name="confirmPassword"
                  type="password"
                  icon={KeyRound}
                  autoComplete="new-password"
                  value={passwords.confirmPassword}
                  onChange={handlePasswordChange}
                  error={mismatch ? 'Passwords do not match' : ''}
                />
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  type="submit"
                  loading={passwordMutation.isPending}
                  disabled={!canChangePassword}
                >
                  Update password
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
