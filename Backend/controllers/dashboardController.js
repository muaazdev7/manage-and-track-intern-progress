import User from '../models/User.js';
import Task from '../models/Task.js';
import Submission from '../models/Submission.js';
import { getProgressLookup, getProgressFor } from '../utils/progress.js';

/**
 * @route  GET /api/dashboard/admin
 * @access admin
 *
 * Every number here is counted from the database — nothing is hardcoded.
 */
export const getAdminDashboard = async (req, res) => {
  const now = new Date();

  const [totalInterns, activeTasks, pendingReviews, overdueTasks] = await Promise.all([
    User.countDocuments({ role: 'intern' }),
    Task.countDocuments({ status: { $ne: 'approved' } }),
    Task.countDocuments({ status: 'submitted' }),
    Task.countDocuments({ status: { $ne: 'approved' }, dueDate: { $lt: now } }),
  ]);

  // Review queue panel — same source as GET /api/submissions/pending.
  const submittedTasks = await Task.find({ status: 'submitted' }).select('_id');

  const pendingSubmissions = await Submission.find({
    task: { $in: submittedTasks.map((task) => task._id) },
    'feedback.reviewedAt': { $exists: false },
  })
    .populate([
      { path: 'intern', select: 'name email avatarUrl' },
      { path: 'task', select: 'title dueDate priority' },
    ])
    .sort({ submittedAt: -1 })
    .limit(10);

  // Intern progress panel — sorted ascending so whoever needs attention
  // surfaces first (PROJECT_PLAN.md §9).
  const interns = await User.find({ role: 'intern', status: 'active' }).select(
    'name email avatarUrl department'
  );

  const progressFor = await getProgressLookup(interns.map((intern) => intern._id));

  const internProgress = interns
    .map((intern) => ({
      _id: intern._id,
      name: intern.name,
      email: intern.email,
      avatarUrl: intern.avatarUrl,
      department: intern.department,
      progress: progressFor(intern._id),
    }))
    .sort((a, b) => a.progress.percentage - b.progress.percentage);

  // Recent activity — assignments, submissions and reviews merged into one
  // timeline, newest first.
  const [recentTasks, recentSubmissions] = await Promise.all([
    Task.find()
      .populate('assignedTo', 'name avatarUrl')
      .sort({ createdAt: -1 })
      .limit(10),
    Submission.find()
      .populate([
        { path: 'intern', select: 'name avatarUrl' },
        { path: 'task', select: 'title' },
      ])
      .sort({ updatedAt: -1 })
      .limit(10),
  ]);

  const activity = [
    ...recentTasks.map((task) => ({
      type: 'task-assigned',
      at: task.createdAt,
      taskId: task._id,
      taskTitle: task.title,
      user: task.assignedTo
        ? { name: task.assignedTo.name, avatarUrl: task.assignedTo.avatarUrl }
        : null,
    })),
    ...recentSubmissions.map((submission) => ({
      type: 'work-submitted',
      at: submission.submittedAt,
      taskId: submission.task?._id,
      taskTitle: submission.task?.title,
      user: submission.intern
        ? { name: submission.intern.name, avatarUrl: submission.intern.avatarUrl }
        : null,
    })),
    ...recentSubmissions
      .filter((submission) => submission.feedback?.reviewedAt)
      .map((submission) => ({
        type:
          submission.feedback.decision === 'approved'
            ? 'task-approved'
            : 'revision-requested',
        at: submission.feedback.reviewedAt,
        taskId: submission.task?._id,
        taskTitle: submission.task?.title,
        user: submission.intern
          ? { name: submission.intern.name, avatarUrl: submission.intern.avatarUrl }
          : null,
      })),
  ]
    .filter((entry) => entry.at)
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 10);

  res.json({
    success: true,
    data: {
      stats: { totalInterns, activeTasks, pendingReviews, overdueTasks },
      pendingSubmissions,
      internProgress,
      activity,
    },
  });
};

/**
 * @route  GET /api/dashboard/intern
 * @access private
 */
export const getInternDashboard = async (req, res) => {
  const internId = req.user._id;

  const progress = await getProgressFor(internId);

  // Upcoming deadlines — soonest first, approved work excluded.
  const upcoming = await Task.find({
    assignedTo: internId,
    status: { $ne: 'approved' },
    dueDate: { $exists: true },
  })
    .sort({ dueDate: 1 })
    .limit(5);

  // Latest feedback the admin has left on this intern's work.
  const latestFeedback = await Submission.find({
    intern: internId,
    'feedback.reviewedAt': { $exists: true },
  })
    .populate([
      { path: 'task', select: 'title status' },
      { path: 'feedback.reviewedBy', select: 'name' },
    ])
    .sort({ 'feedback.reviewedAt': -1 })
    .limit(5);

  res.json({
    success: true,
    data: {
      intern: { name: req.user.name, avatarUrl: req.user.avatarUrl },
      progress,
      upcoming,
      latestFeedback,
    },
  });
};
