import express from 'express';
import { body, param } from 'express-validator';

import {
  createSubmission,
  getPendingSubmissions,
  getSubmissionsForTask,
  reviewSubmission,
  downloadFile,
} from '../controllers/submissionController.js';
import { protect, requireAdmin } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { uploadSubmissionFiles, removeUploadedFiles } from '../middleware/upload.js';
import { FEEDBACK_DECISIONS } from '../models/Submission.js';

const router = express.Router();

router.use(protect);

/**
 * Validation runs after multer, so files may already be on disk when a rule
 * fails. Wrap the shared validator to clean them up first.
 */
const validateSubmission = (req, res, next) => {
  const originalStatus = res.status.bind(res);
  res.status = (code) => {
    if (code >= 400) removeUploadedFiles(req.files);
    return originalStatus(code);
  };
  return validate(req, res, next);
};

/* ---------- Admin-only ---------- */
router.get('/pending', requireAdmin, getPendingSubmissions);

router.put(
  '/:id/feedback',
  requireAdmin,
  [
    param('id').isMongoId().withMessage('Invalid submission ID'),
    body('decision')
      .isIn(FEEDBACK_DECISIONS)
      .withMessage('Decision must be approved or needs-revision'),
    body('comment')
      .trim()
      .notEmpty()
      .withMessage('Feedback comment is required')
      .isLength({ max: 2000 })
      .withMessage('Feedback is too long'),
  ],
  validate,
  reviewSubmission
);

/* ---------- Shared (ownership enforced in the controllers) ---------- */
router.get(
  '/task/:taskId',
  [param('taskId').isMongoId().withMessage('Invalid task ID')],
  validate,
  getSubmissionsForTask
);

router.get('/file/:filename', downloadFile);

/* ---------- Intern submits work ---------- */
router.post(
  '/',
  uploadSubmissionFiles,
  [
    body('taskId').isMongoId().withMessage('A valid task is required'),
    body('notes')
      .trim()
      .notEmpty()
      .withMessage('Notes are required')
      .isLength({ max: 5000 })
      .withMessage('Notes are too long'),
    body('link')
      .optional({ values: 'falsy' })
      .trim()
      .isURL()
      .withMessage('Link must be a valid URL'),
  ],
  validateSubmission,
  createSubmission
);

export default router;
