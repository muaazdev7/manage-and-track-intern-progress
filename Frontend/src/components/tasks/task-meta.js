import { isPast } from 'date-fns';

/**
 * Shared task vocabulary — labels, colors and ordering.
 * Kept out of the badge components so those files export only components,
 * which is what React Fast Refresh requires.
 *
 * Colors are fixed by PROJECT_PLAN.md §9.
 */
export const STATUS_META = {
  pending: { label: 'Pending', tone: 'slate' },
  'in-progress': { label: 'In Progress', tone: 'blue' },
  submitted: { label: 'Submitted', tone: 'amber' },
  approved: { label: 'Approved', tone: 'emerald' },
  'needs-revision': { label: 'Needs Revision', tone: 'red' },
};

export const STATUS_ORDER = [
  'pending',
  'in-progress',
  'submitted',
  'approved',
  'needs-revision',
];

export const PRIORITY_META = {
  low: { label: 'Low', tone: 'slate', bar: 'bg-slate-300' },
  medium: { label: 'Medium', tone: 'amber', bar: 'bg-amber-400' },
  high: { label: 'High', tone: 'red', bar: 'bg-red-500' },
};

export const PRIORITY_ORDER = ['low', 'medium', 'high'];

/**
 * An approved task is never overdue however late it was — the same rule the
 * server applies in the Task model's isOverdue virtual (PROJECT_PLAN.md §6).
 */
export const isTaskOverdue = (task) =>
  Boolean(task?.dueDate) &&
  task.status !== 'approved' &&
  isPast(new Date(task.dueDate));
