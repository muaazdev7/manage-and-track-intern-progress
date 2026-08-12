import User from '../models/User.js';
import Task from '../models/Task.js';
import Submission from '../models/Submission.js';
import Notification from '../models/Notification.js';
import { removeUploadedFiles } from '../middleware/upload.js';
import { getProgressLookup } from '../utils/progress.js';

/** Fields the client is allowed to see. Never includes password. */
const toPublicIntern = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  university: user.university,
  department: user.department,
  position: user.position,
  startDate: user.startDate,
  endDate: user.endDate,
  status: user.status,
  avatarUrl: user.avatarUrl,
  mustChangePassword: user.mustChangePassword,
  lastLogin: user.lastLogin,
  createdAt: user.createdAt,
});

/**
 * Random temp password: always 12 chars, always contains a digit, so it
 * satisfies both the schema minlength and the change-password rules.
 */
const generateTempPassword = () => {
  const letters = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const pool = letters + digits;

  const chars = Array.from(
    { length: 11 },
    () => pool[Math.floor(Math.random() * pool.length)]
  );

  // Guarantee at least one digit, at a random position.
  chars.splice(
    Math.floor(Math.random() * chars.length),
    0,
    digits[Math.floor(Math.random() * digits.length)]
  );

  return chars.join('');
};

// Progress now comes from utils/progress.js, which owns the Task aggregation.

/**
 * Copy whitelisted fields from a request body onto a document.
 *
 * Anything absent from the body is left untouched (a partial update), but an
 * explicit empty string means "clear this field" — setting the path to
 * undefined makes Mongoose $unset it, so the document stays clean rather than
 * accumulating empty strings.
 *
 * The whitelist is what stops role/password/status being set from the body:
 * unlisted keys are ignored no matter what the client sends.
 */
const applyEditableFields = (doc, body, editable) => {
  editable.forEach((field) => {
    const value = body[field];
    if (value === undefined) return;

    doc[field] = typeof value === 'string' && value.trim() === '' ? undefined : value;
  });
};

/**
 * @route  GET /api/interns
 * @access admin
 */
export const getInterns = async (req, res) => {
  const { search = '', status = '', department = '' } = req.query;

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));

  const filter = { role: 'intern' };

  if (search.trim()) {
    // Escape regex metacharacters so a search for "a.b" is literal.
    const safe = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(safe, 'i');
    filter.$or = [{ name: pattern }, { email: pattern }];
  }

  if (status) filter.status = status;
  if (department) filter.department = department;

  const [interns, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  const progressFor = await getProgressLookup(interns.map((intern) => intern._id));

  res.json({
    success: true,
    data: {
      interns: interns.map((intern) => ({
        ...toPublicIntern(intern),
        progress: progressFor(intern._id),
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    },
  });
};

/**
 * @route  POST /api/interns
 * @access admin
 */
export const createIntern = async (req, res) => {
  const {
    name,
    email,
    phone,
    university,
    department,
    position,
    startDate,
    endDate,
  } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res
      .status(400)
      .json({ success: false, message: 'That email is already in use' });
  }

  const tempPassword = generateTempPassword();

  const intern = await User.create({
    name,
    email,
    password: tempPassword,
    role: 'intern',
    phone,
    university,
    department,
    position,
    startDate,
    endDate,
    mustChangePassword: true,
  });

  res.status(201).json({
    success: true,
    message: 'Intern onboarded successfully',
    data: {
      intern: toPublicIntern(intern),
      // Shown to the admin exactly once. Only the hash is stored.
      tempPassword,
    },
  });
};

/**
 * @route  GET /api/interns/:id
 * @access admin
 */
export const getInternById = async (req, res) => {
  const intern = await User.findOne({ _id: req.params.id, role: 'intern' });

  if (!intern) {
    return res.status(404).json({ success: false, message: 'Intern not found' });
  }

  const progressFor = await getProgressLookup([intern._id]);

  res.json({
    success: true,
    data: {
      ...toPublicIntern(intern),
      progress: progressFor(intern._id),
    },
  });
};

/**
 * @route  PUT /api/interns/:id
 * @access admin
 */
export const updateIntern = async (req, res) => {
  const intern = await User.findOne({ _id: req.params.id, role: 'intern' });

  if (!intern) {
    return res.status(404).json({ success: false, message: 'Intern not found' });
  }

  // Whitelist — stops role/password/mustChangePassword being set from the body.
  // name, email and status are required, so they are never cleared to empty.
  applyEditableFields(intern, req.body, [
    'phone',
    'university',
    'department',
    'position',
    'startDate',
    'endDate',
  ]);

  ['name', 'email', 'status'].forEach((field) => {
    if (req.body[field]) intern[field] = req.body[field];
  });

  await intern.save();

  res.json({
    success: true,
    message: 'Intern updated successfully',
    data: toPublicIntern(intern),
  });
};

/**
 * @route  DELETE /api/interns/:id
 * @access admin
 */
export const deleteIntern = async (req, res) => {
  const intern = await User.findOne({ _id: req.params.id, role: 'intern' });

  if (!intern) {
    return res.status(404).json({ success: false, message: 'Intern not found' });
  }

  // Cascade — orphaned documents must never outlive their owner, and their
  // uploaded files come off disk with them.
  const owned = await Submission.find({ intern: intern._id }).select('files');
  owned.forEach((submission) => removeUploadedFiles(submission.files));

  const [tasks, submissions] = await Promise.all([
    Task.deleteMany({ assignedTo: intern._id }),
    Submission.deleteMany({ intern: intern._id }),
    // Their own notifications go too — nobody can ever read them again.
    Notification.deleteMany({ user: intern._id }),
  ]);

  await intern.deleteOne();

  res.json({
    success: true,
    message: 'Intern removed successfully',
    data: {
      deletedTasks: tasks.deletedCount,
      deletedSubmissions: submissions.deletedCount,
    },
  });
};

/**
 * @route  PUT /api/interns/:id/reset-password
 * @access admin
 */
export const resetInternPassword = async (req, res) => {
  const intern = await User.findOne({ _id: req.params.id, role: 'intern' });

  if (!intern) {
    return res.status(404).json({ success: false, message: 'Intern not found' });
  }

  const tempPassword = generateTempPassword();

  intern.password = tempPassword; // pre('save') hook hashes it
  intern.mustChangePassword = true;
  await intern.save();

  res.json({
    success: true,
    message: 'Password reset successfully',
    data: { tempPassword },
  });
};

/**
 * @route  GET /api/interns/me/profile
 * @access private
 */
export const getMyProfile = async (req, res) => {
  const progressFor = await getProgressLookup([req.user._id]);

  res.json({
    success: true,
    data: {
      ...toPublicIntern(req.user),
      progress: progressFor(req.user._id),
    },
  });
};

/**
 * @route  PUT /api/interns/me/profile
 * @access private
 */
export const updateMyProfile = async (req, res) => {
  const intern = await User.findById(req.user._id);

  // Deliberately narrow: everything else on the profile is admin-owned
  // (PROJECT_PLAN.md §9 shows those fields greyed out for interns).
  // Sending role, password, email, department, status etc. has no effect —
  // they are not on this list.
  applyEditableFields(intern, req.body, ['phone', 'university', 'avatarUrl']);

  await intern.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: toPublicIntern(intern),
  });
};
