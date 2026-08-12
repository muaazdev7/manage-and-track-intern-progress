import path from 'node:path';
import fs from 'node:fs';

import Submission from '../models/Submission.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { removeUploadedFiles, UPLOAD_DIR } from '../middleware/upload.js';
import { emitToUser, emitToAdmins } from '../config/socket.js';
import { notify, emitProgressUpdate } from '../utils/notify.js';

const POPULATE = [
  { path: 'intern', select: 'name email avatarUrl department position' },
  { path: 'task', select: 'title description status priority dueDate assignedTo' },
  { path: 'feedback.reviewedBy', select: 'name email' },
];

/** Map multer's file objects onto the schema's file subdocuments. */
const toFileDocs = (files = []) =>
  files.map((file) => ({
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
  }));

/**
 * @route  POST /api/submissions
 * @access private (assignee only)
 *
 * Multipart. Files are already on disk by the time this runs, so every
 * rejection path has to clean them up or the uploads folder fills with
 * orphans from failed requests.
 */
export const createSubmission = async (req, res) => {
  const { taskId, notes, link } = req.body;

  const fail = (status, message) => {
    removeUploadedFiles(req.files);
    return res.status(status).json({ success: false, message });
  };

  const task = await Task.findById(taskId);

  if (!task) return fail(404, 'Task not found');

  // Ownership: only the assignee may submit against this task.
  if (String(task.assignedTo) !== String(req.user._id)) {
    return fail(403, 'You can only submit work for tasks assigned to you');
  }

  if (task.status === 'approved') {
    return fail(400, 'This task has already been approved');
  }

  const submission = await Submission.create({
    task: task._id,
    intern: req.user._id,
    notes,
    link,
    files: toFileDocs(req.files),
    submittedAt: new Date(),
  });

  task.status = 'submitted';
  await task.save();

  await submission.populate(POPULATE);

  // Push the new submission into every admin's review queue, and give each
  // admin a notification so the bell increments without a refresh.
  emitToAdmins('submission:new', submission);
  emitToAdmins('task:updated', task);
  emitToUser(req.user._id, 'task:updated', task);

  const admins = await User.find({ role: 'admin' }).select('_id');

  await Promise.all(
    admins.map((admin) =>
      notify({
        user: admin._id,
        type: 'task-submitted',
        title: 'Work submitted for review',
        message: `${req.user.name} submitted work for "${task.title}".`,
        link: '/admin/review',
      })
    )
  );

  await emitProgressUpdate(req.user._id);

  res.status(201).json({
    success: true,
    message: 'Work submitted successfully',
    data: submission,
  });
};

/**
 * @route  GET /api/submissions/pending
 * @access admin
 *
 * The review queue: submissions whose task is still awaiting a decision.
 */
export const getPendingSubmissions = async (req, res) => {
  const submittedTasks = await Task.find({ status: 'submitted' }).select('_id');

  const submissions = await Submission.find({
    task: { $in: submittedTasks.map((task) => task._id) },
    'feedback.reviewedAt': { $exists: false },
  })
    .populate(POPULATE)
    .sort({ submittedAt: -1 });

  res.json({
    success: true,
    data: { submissions, total: submissions.length },
  });
};

/**
 * @route  GET /api/submissions/task/:taskId
 * @access private (admin, or the assignee)
 */
export const getSubmissionsForTask = async (req, res) => {
  const task = await Task.findById(req.params.taskId);

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  const isOwner = String(task.assignedTo) === String(req.user._id);

  if (req.user.role !== 'admin' && !isOwner) {
    return res.status(403).json({
      success: false,
      message: 'You do not have access to this task',
    });
  }

  const submissions = await Submission.find({ task: task._id })
    .populate(POPULATE)
    .sort({ submittedAt: -1 });

  res.json({ success: true, data: submissions });
};

/**
 * @route  PUT /api/submissions/:id/feedback
 * @access admin
 */
export const reviewSubmission = async (req, res) => {
  const { comment, decision } = req.body;

  const submission = await Submission.findById(req.params.id);

  if (!submission) {
    return res
      .status(404)
      .json({ success: false, message: 'Submission not found' });
  }

  if (submission.feedback?.reviewedAt) {
    return res
      .status(400)
      .json({ success: false, message: 'This submission has already been reviewed' });
  }

  const task = await Task.findById(submission.task);

  if (!task) {
    return res
      .status(404)
      .json({ success: false, message: 'The task for this submission no longer exists' });
  }

  submission.feedback = {
    comment,
    decision,
    reviewedBy: req.user._id,
    reviewedAt: new Date(),
  };
  await submission.save();

  if (decision === 'approved') {
    task.status = 'approved';
    task.completedAt = new Date();
  } else {
    task.status = 'needs-revision';
    task.completedAt = undefined;
  }
  await task.save();

  await submission.populate(POPULATE);

  const approved = decision === 'approved';

  // The intern's data changed: feedback arrived and the task moved.
  emitToUser(submission.intern._id, 'feedback:received', submission);
  emitToUser(submission.intern._id, 'task:updated', task);
  emitToAdmins('task:updated', task);

  await notify({
    user: submission.intern._id,
    type: approved ? 'task-approved' : 'revision-requested',
    title: approved ? 'Task approved' : 'Revision requested',
    message: approved
      ? `${req.user.name} approved your work on "${task.title}".`
      : `${req.user.name} asked for changes on "${task.title}".`,
    link: `/intern/tasks/${task._id}`,
  });

  // Approval is what moves the percentage — broadcast it to the admin room.
  await emitProgressUpdate(submission.intern._id);

  res.json({
    success: true,
    message: approved ? 'Submission approved' : 'Revision requested',
    data: submission,
  });
};

/**
 * @route  GET /api/submissions/file/:filename
 * @access private (admin, or the intern who uploaded it)
 *
 * Attachments are served through this authorised route rather than
 * express.static('uploads'), which would make every file public to anyone
 * who guessed the URL (PROJECT_PLAN.md §10).
 */
export const downloadFile = async (req, res) => {
  const { filename } = req.params;

  // Defence in depth: filenames are generated server-side, but never let a
  // crafted value escape the uploads directory.
  const safeName = path.basename(filename);

  const submission = await Submission.findOne({ 'files.filename': safeName });

  if (!submission) {
    return res.status(404).json({ success: false, message: 'File not found' });
  }

  const isOwner = String(submission.intern) === String(req.user._id);

  if (req.user.role !== 'admin' && !isOwner) {
    return res
      .status(403)
      .json({ success: false, message: 'You do not have access to this file' });
  }

  const file = submission.files.find((entry) => entry.filename === safeName);
  const absolutePath = path.join(UPLOAD_DIR, safeName);

  if (!fs.existsSync(absolutePath)) {
    return res
      .status(404)
      .json({ success: false, message: 'File is missing from storage' });
  }

  res.download(absolutePath, file.originalName);
};
