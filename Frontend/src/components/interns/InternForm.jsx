import { useState } from 'react';

import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'terminated', label: 'Terminated' },
];

/** yyyy-MM-dd for <input type="date">, tolerating null/ISO input. */
const toDateInput = (value) => (value ? String(value).slice(0, 10) : '');

const buildInitialState = (intern) => ({
  name: intern?.name ?? '',
  email: intern?.email ?? '',
  phone: intern?.phone ?? '',
  university: intern?.university ?? '',
  department: intern?.department ?? '',
  position: intern?.position ?? '',
  startDate: toDateInput(intern?.startDate),
  endDate: toDateInput(intern?.endDate),
  status: intern?.status ?? 'active',
});

/**
 * Used for both onboarding and editing. `intern` present => edit mode,
 * which also exposes the status field (a new intern is always active).
 */
const InternForm = ({ intern, onSubmit, onCancel, submitting = false, error }) => {
  const isEdit = Boolean(intern);

  const [form, setForm] = useState(() => buildInitialState(intern));
  const [touched, setTouched] = useState(false);

  const errors = {
    name: form.name.trim() ? '' : 'Name is required',
    email: /^\S+@\S+\.\S+$/.test(form.email.trim())
      ? ''
      : 'A valid email is required',
    endDate:
      form.startDate && form.endDate && form.endDate < form.startDate
        ? 'End date must be after the start date'
        : '',
  };

  const isValid = !errors.name && !errors.email && !errors.endDate;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (!isValid) return;

    /**
     * On create, drop blank optional fields so the new document doesn't carry
     * empty keys. On edit, send them as-is: a field the admin cleared must
     * reach the server as '' so it can be unset — dropping the key would make
     * the server treat it as "unchanged" and silently keep the old value.
     */
    const payload = isEdit
      ? { ...form }
      : Object.fromEntries(
          Object.entries(form).filter(([, value]) => value !== '')
        );

    if (!isEdit) delete payload.status;

    onSubmit(payload);
  };

  const show = (field) => (touched ? errors[field] : '');

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Full name"
          name="name"
          value={form.name}
          onChange={handleChange}
          error={show('name')}
          placeholder="Ayesha Khan"
          required
        />
        <Input
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          error={show('email')}
          placeholder="ayesha@company.com"
          required
        />
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
          label="Department"
          name="department"
          value={form.department}
          onChange={handleChange}
          placeholder="Web Development"
        />
        <Input
          label="Position"
          name="position"
          value={form.position}
          onChange={handleChange}
          placeholder="Frontend Intern"
        />
        <Input
          label="Start date"
          name="startDate"
          type="date"
          value={form.startDate}
          onChange={handleChange}
        />
        <Input
          label="End date"
          name="endDate"
          type="date"
          value={form.endDate}
          onChange={handleChange}
          error={show('endDate')}
        />

        {isEdit && (
          <Select
            label="Status"
            name="status"
            value={form.status}
            onChange={handleChange}
            options={STATUS_OPTIONS}
          />
        )}
      </div>

      {!isEdit && (
        <p className="mt-4 text-xs text-slate-500">
          A temporary password is generated automatically and shown once after
          saving.
        </p>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {isEdit ? 'Save changes' : 'Onboard intern'}
        </Button>
      </div>
    </form>
  );
};

export default InternForm;
