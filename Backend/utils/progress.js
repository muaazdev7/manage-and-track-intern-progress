import Task from '../models/Task.js';
import { TASK_STATUSES } from '../models/Task.js';

/** Every status present with a zero, so callers never index into undefined. */
const emptyByStatus = () =>
  Object.fromEntries(TASK_STATUSES.map((status) => [status, 0]));

const emptyProgress = () => ({
  total: 0,
  approved: 0,
  percentage: 0,
  overdue: 0,
  byStatus: emptyByStatus(),
});

/**
 * Progress for many interns in one round trip.
 * Returns a lookup function so callers can map over a page of interns
 * without issuing a query each.
 *
 * Formula is fixed by PROJECT_PLAN.md §2: approved ÷ total assigned.
 */
export const getProgressLookup = async (internIds) => {
  const now = new Date();

  const rows = await Task.aggregate([
    { $match: { assignedTo: { $in: internIds } } },
    {
      $group: {
        _id: { intern: '$assignedTo', status: '$status' },
        count: { $sum: 1 },
        overdue: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ['$status', 'approved'] },
                  { $lt: ['$dueDate', now] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  const byIntern = new Map();

  rows.forEach((row) => {
    const key = String(row._id.intern);
    const entry = byIntern.get(key) ?? emptyProgress();

    entry.byStatus[row._id.status] = row.count;
    entry.total += row.count;
    entry.overdue += row.overdue;

    byIntern.set(key, entry);
  });

  byIntern.forEach((entry) => {
    entry.approved = entry.byStatus.approved;
    entry.percentage =
      entry.total === 0 ? 0 : Math.round((entry.approved / entry.total) * 100);
  });

  return (internId) => byIntern.get(String(internId)) ?? emptyProgress();
};

/** Progress for a single intern. */
export const getProgressFor = async (internId) => {
  const lookup = await getProgressLookup([internId]);
  return lookup(internId);
};

export default getProgressFor;
