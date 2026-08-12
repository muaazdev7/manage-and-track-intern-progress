import mongoose from 'mongoose';

import Task from '../models/Task.js';
import User from '../models/User.js';
import Submission from '../models/Submission.js';
import { removeUploadedFiles } from '../middleware/upload.js';
import { emitToUser, emitToAdmins } from '../config/socket.js';
import { notify, emitProgressUpdate } from '../utils/notify.js';

/** Shape used everywhere a task is returned with its people attached. */
const POPULATE = [
  { path: 'assignedTo', select: 'name email avatarUrl department position' },
  { path: 'assignedBy', select: 'name email' },
];

/** Turns the shared query params into a mongo filter. */
const buildFilter = ({ status, priority, assignedTo, overdue, search }) => {
  const filter = {};

  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  // Cast explicitly: find() coerces a string id against a ref'd path, but
  // aggregate()'s $match does not — countsByStatus would silently match zero.
  if (assignedTo && mongoose.isValidObjectId(assignedTo)) {
    filter.assignedTo = new mongoose.Types.ObjectId(assignedTo);
  }

  if (search?.trim()) {
    // Escape regex metacharacters so a search for "v1.0" stays literal.
    const safe = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(safe, 'i');
    filter.$or = [{ title: pattern }, { description: pattern }];
  }

  // Overdue is derived, not stored (PROJECT_PLAN.md §6): past due and
  // not yet approved.
  if (overdue === 'true') {
    filter.dueDate = { $lt: new Date() };
    // Don't clobber an explicit status filter — an approved task is simply
    // never overdue, so combining the two is already consistent.
    if (!status) filter.status = { $ne: 'approved' };
  }

  return filter;
};

/** Counts per status for the admin tabs, respecting the non-status filters. */
const countsByStatus = async (baseFilter) => {
  const { status, ...withoutStatus } = baseFilter;

  const rows = await Task.aggregate([
    { $match: withoutStatus },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const counts = { all: 0 };
  rows.forEach((row) => {
    counts[row._id] = row.count;
    counts.all += row.count;
  });

  return counts;
};

/**
 * @route  GET /api/tasks
 * @access admin
 */
export const getTasks = async (req, res) => {
  const filter = buildFilter(req.query);

  const [tasks, counts] = await Promise.all([
    Task.find(filter).populate(POPULATE).sort({ dueDate: 1, createdAt: -1 }),
    countsByStatus(filter),
  ]);

  res.json({ success: true, data: { tasks, counts } });
};

/**
 * @route  POST /api/tasks
 * @access admin
 *
 * `assignedTo` may be a single id or an array. An array fans out into one
 * independent task document per intern (PROJECT_PLAN.md §2).
 */
export const createTask = async (req, res) => {
  const { title, description, assignedTo, priority, dueDate } = req.body;

  const assignees = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
  const uniqueAssignees = [...new Set(assignees.map(String))];

  // Every assignee must be a real, non-admin account.
  const interns = await User.find({
    _id: { $in: uniqueAssignees },
    role: 'intern',
  }).select('_id');

  if (interns.length !== uniqueAssignees.length) {
    return res.status(400).json({
      success: false,
      message: 'One or more selected interns could not be found',
    });
  }

  const created = await Task.insertMany(
    interns.map((intern) => ({
      title,
      description,
      assignedTo: intern._id,
      assignedBy: req.user._id,
      priority,
      dueDate,
    }))
  );

  const tasks = await Task.find({ _id: { $in: created.map((t) => t._id) } })
    .populate(POPULATE)
    .sort({ createdAt: -1 });

  // Each assignee gets their own copy pushed to them, plus a notification
  // (PROJECT_PLAN.md §8).
  await Promise.all(
    tasks.map(async (task) => {
      emitToUser(task.assignedTo._id, 'task:assigned', task);

      await notify({
        user: task.assignedTo._id,
        type: 'task-assigned',
        title: 'New task assigned',
        message: `${req.user.name} assigned you "${task.title}".`,
        link: `/intern/tasks/${task._id}`,
      });

      await emitProgressUpdate(task.assignedTo._id);
    })
  );

  res.status(201).json({
    success: true,
    message: `Task assigned to ${tasks.length} intern${
      tasks.length === 1 ? '' : 's'
    }`,
    data: tasks,
  });
};

/**
 * @route  GET /api/tasks/my
 * @access private (intern)
 */
export const getMyTasks = async (req, res) => {
  const filter = {
    ...buildFilter(req.query),
    // Always scoped to the caller — never taken from the query string.
    assignedTo: req.user._id,
  };

  const [tasks, counts] = await Promise.all([
    Task.find(filter).populate(POPULATE).sort({ dueDate: 1, createdAt: -1 }),
    countsByStatus(filter),
  ]);

  res.json({ success: true, data: { tasks, counts } });
};

/**
 * @route  GET /api/tasks/:id
 * @access private (admin, or the assignee)
 */
export const getTaskById = async (req, res) => {
  const task = await Task.findById(req.params.id).populate(POPULATE);

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  // Ownership check. An intern editing the URL to someone else's task id
  // must be refused here, not merely hidden in the UI.
  const isOwner = String(task.assignedTo?._id) === String(req.user._id);

  if (req.user.role !== 'admin' && !isOwner) {
    return res.status(403).json({
      success: false,
      message: 'You do not have access to this task',
    });
  }

  res.json({ success: true, data: task });
};

/**
 * @route  PUT /api/tasks/:id
 * @access admin
 */
export const updateTask = async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  if (req.body.assignedTo) {
    const intern = await User.findOne({
      _id: req.body.assignedTo,
      role: 'intern',
    });

    if (!intern) {
      return res
        .status(400)
        .json({ success: false, message: 'Assigned intern could not be found' });
    }
  }

  // Whitelist — status is deliberately absent. Admin status changes belong to
  // the review flow in Phase 6; interns use PATCH /:id/status.
  const editable = [
    'title',
    'description',
    'assignedTo',
    'priority',
    'dueDate',
  ];

  editable.forEach((field) => {
    if (req.body[field] !== undefined) task[field] = req.body[field];
  });

  await task.save();
  await task.populate(POPULATE);

  emitToUser(task.assignedTo._id, 'task:updated', task);
  emitToAdmins('task:updated', task);

  res.json({ success: true, message: 'Task updated successfully', data: task });
};

/**
 * @route  DELETE /api/tasks/:id
 * @access admin
 */
export const deleteTask = async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  // Submissions cascade with the task, and their uploads come off disk too —
  // otherwise the uploads folder grows forever with unreachable files.
  const owned = await Submission.find({ task: task._id }).select('files');
  owned.forEach((submission) => removeUploadedFiles(submission.files));

  const submissions = await Submission.deleteMany({ task: task._id });

  const assignee = task.assignedTo;
  await task.deleteOne();

  emitToUser(assignee, 'task:deleted', { _id: task._id });
  await emitProgressUpdate(assignee);

  res.json({
    success: true,
    message: 'Task deleted successfully',
    data: { deletedSubmissions: submissions.deletedCount },
  });
};

/**
 * @route  PATCH /api/tasks/:id/status
 * @access private (assignee only)
 *
 * The only transition an intern may make on their own is
 * pending → in-progress. Everything else is the review flow (Phase 6).
 */
export const updateTaskStatus = async (req, res) => {
  const { status } = req.body;

  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  if (String(task.assignedTo) !== String(req.user._id)) {
    return res.status(403).json({
      success: false,
      message: 'You can only update tasks assigned to you',
    });
  }

  if (task.status !== 'pending' || status !== 'in-progress') {
    return res.status(400).json({
      success: false,
      message: 'Only a pending task can be moved to in progress',
    });
  }

  task.status = 'in-progress';
  await task.save();
  await task.populate(POPULATE);

  // Status changed — tell the assignee's other tabs and every admin.
  emitToUser(task.assignedTo._id, 'task:updated', task);
  emitToAdmins('task:updated', task);
  await emitProgressUpdate(task.assignedTo._id);

  res.json({ success: true, message: 'Task started', data: task });
};
