import express from 'express';
import { body, param } from 'express-validator';

import {
  getInterns,
  createIntern,
  getInternById,
  updateIntern,
  deleteIntern,
  resetInternPassword,
  getMyProfile,
  updateMyProfile,
} from '../controllers/internController.js';
import { protect, requireAdmin } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = express.Router();

// Every route below requires a session.
router.use(protect);

/* ---------- Intern's own profile (any authenticated user) ---------- */
// Declared before '/:id' so the literal path always wins the match.
router
  .route('/me/profile')
  .get(getMyProfile)
  .put(
    [
      body('phone').optional({ values: 'falsy' }).trim().isLength({ max: 30 }),
      body('university').optional({ values: 'falsy' }).trim().isLength({ max: 120 }),
      body('avatarUrl')
        .optional({ values: 'falsy' })
        .trim()
        .isURL()
        .withMessage('Avatar must be a valid URL'),
    ],
    validate,
    updateMyProfile
  );

/* ---------- Admin-only ---------- */
router.use(requireAdmin);

const idParam = param('id').isMongoId().withMessage('Invalid intern ID');

router
  .route('/')
  .get(getInterns)
  .post(
    [
      body('name').trim().notEmpty().withMessage('Name is required'),
      body('email')
        .trim()
        .toLowerCase()
        .isEmail()
        .withMessage('A valid email is required'),
      body('phone').optional({ values: 'falsy' }).trim(),
      body('university').optional({ values: 'falsy' }).trim(),
      body('department').optional({ values: 'falsy' }).trim(),
      body('position').optional({ values: 'falsy' }).trim(),
      body('startDate')
        .optional({ values: 'falsy' })
        .isISO8601()
        .withMessage('Start date must be a valid date'),
      body('endDate')
        .optional({ values: 'falsy' })
        .isISO8601()
        .withMessage('End date must be a valid date')
        .custom((value, { req }) => {
          if (req.body.startDate && new Date(value) < new Date(req.body.startDate)) {
            throw new Error('End date must be after the start date');
          }
          return true;
        }),
    ],
    validate,
    createIntern
  );

router
  .route('/:id')
  .get([idParam], validate, getInternById)
  .put(
    [
      idParam,
      body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
      body('email')
        .optional()
        .trim()
        .toLowerCase()
        .isEmail()
        .withMessage('A valid email is required'),
      body('status')
        .optional()
        .isIn(['active', 'completed', 'terminated'])
        .withMessage('Invalid status'),
      body('startDate').optional({ values: 'falsy' }).isISO8601(),
      body('endDate').optional({ values: 'falsy' }).isISO8601(),
    ],
    validate,
    updateIntern
  )
  .delete([idParam], validate, deleteIntern);

router.put('/:id/reset-password', [idParam], validate, resetInternPassword);

export default router;
