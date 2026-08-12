import { useState } from 'react';
import { Check, Search } from 'lucide-react';

import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Avatar from '../ui/Avatar';
import { PRIORITY_ORDER, PRIORITY_META } from './task-meta';

const PRIORITY_OPTIONS = PRIORITY_ORDER.map((value) => ({
  value,
  label: PRIORITY_META[value].label,
}));

const toDateInput = (value) => (value ? String(value).slice(0, 10) : '');

/**
 * Multi-select assignee list. One submission fans out into N task documents
 * server-side (PROJECT_PLAN.md §2), so editing is single-assignee only.
 */
const AssigneePicker = ({ interns, selected, onToggle, multiple, error }) => {
  const [filter, setFilter] = useState('');

  const visible = interns.filter((intern) =>
    `${intern.name} ${intern.email}`.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {multiple ? 'Assign to' : 'Assignee'}
        <span className="ml-0.5 text-red-500">*</span>
      </label>

      <Input
        icon={Search}
        placeholder="Filter interns…"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        className="mb-2"
        aria-label="Filter interns"
      />

      <div
        className={`max-h-52 overflow-y-auto rounded-lg border ${
          error ? 'border-red-400' : 'border-slate-300'
        }`}
      >
        {visible.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-slate-500">
            No interns match that filter.
          </p>
        ) : (
          visible.map((intern) => {
            const checked = selected.includes(intern._id);

            return (
              <button
                type="button"
                key={intern._id}
                onClick={() => onToggle(intern._id)}
                className={`flex w-full items-center gap-3 border-b border-slate-100 px-3 py-2.5 text-left last:border-b-0 ${
                  checked ? 'bg-brand-50' : 'hover:bg-slate-50'
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    checked
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-slate-300 bg-white'
                  } ${multiple ? '' : 'rounded-full'}`}
                >
                  {checked && <Check className="h-3 w-3" />}
                </span>

                <Avatar name={intern.name} src={intern.avatarUrl} size="xs" />

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-slate-900">
                    {intern.name}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {intern.department || intern.email}
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>

      {error ? (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      ) : (
        multiple && (
          <p className="mt-1.5 text-xs text-slate-500">
            {selected.length === 0
              ? 'Select one or more interns.'
              : `${selected.length} intern${
                  selected.length === 1 ? '' : 's'
                } selected — one task will be created for each.`}
          </p>
        )
      )}
    </div>
  );
};

const TaskForm = ({
  task,
  interns = [],
  onSubmit,
  onCancel,
  submitting = false,
  error,
}) => {
  const isEdit = Boolean(task);

  const [form, setForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    priority: task?.priority ?? 'medium',
    dueDate: toDateInput(task?.dueDate),
  });

  const [assignees, setAssignees] = useState(() =>
    task?.assignedTo ? [task.assignedTo._id ?? task.assignedTo] : []
  );
  const [touched, setTouched] = useState(false);

  const errors = {
    title: form.title.trim() ? '' : 'Title is required',
    dueDate: form.dueDate ? '' : 'Due date is required',
    assignees: assignees.length ? '' : 'Select at least one intern',
  };

  const isValid = !errors.title && !errors.dueDate && !errors.assignees;
  const show = (field) => (touched ? errors[field] : '');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const toggleAssignee = (id) => {
    if (isEdit) {
      setAssignees([id]); // reassignment replaces, never fans out
      return;
    }
    setAssignees((previous) =>
      previous.includes(id)
        ? previous.filter((value) => value !== id)
        : [...previous, id]
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (!isValid) return;

    onSubmit({
      ...form,
      description: form.description || undefined,
      assignedTo: isEdit ? assignees[0] : assignees,
    });
  };

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

      <div className="space-y-4">
        <Input
          label="Title"
          name="title"
          value={form.title}
          onChange={handleChange}
          error={show('title')}
          placeholder="Build the login page"
          required
        />

        <Textarea
          label="Description"
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          maxLength={1000}
          placeholder="What needs to be done, and what does done look like?"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Priority"
            name="priority"
            value={form.priority}
            onChange={handleChange}
            options={PRIORITY_OPTIONS}
          />
          <Input
            label="Due date"
            name="dueDate"
            type="date"
            value={form.dueDate}
            onChange={handleChange}
            error={show('dueDate')}
            required
          />
        </div>

        <AssigneePicker
          interns={interns}
          selected={assignees}
          onToggle={toggleAssignee}
          multiple={!isEdit}
          error={show('assignees')}
        />
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {isEdit
            ? 'Save changes'
            : `Create task${assignees.length > 1 ? `s (${assignees.length})` : ''}`}
        </Button>
      </div>
    </form>
  );
};

export default TaskForm;
