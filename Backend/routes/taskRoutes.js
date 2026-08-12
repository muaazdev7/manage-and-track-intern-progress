import express from 'express';
import { body, param } from 'express-validator';

import {
  getTasks,
  createTask,
  getMyTasks,
  getTaskById,
  updateTask,
  deleteTask,
  updateTaskStatus,
} from '../controllers/taskController.js';
import { protect, requireAdmin } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { TASK_PRIORITIES } from '../models/Task.js';

const router = express.Router();

router.use(protect);

const idParam = param('id').isMongoId().withMessage('Invalid task ID');

/* ---------- Intern-facing ---------- */
// Declared before '/:id' so 'my' is never parsed as an id.
router.get('/my', getMyTasks);

router.patch(
  '/:id/status',
  [
    idParam,
    body('status')
      .equals('in-progress')
      .withMessage('An intern can only move a task to in progress'),
  ],
  validate,
  updateTaskStatus
);

// Shared: admins see any task, interns only their own (enforced in the controller).
router.get('/:id', [idParam], validate, getTaskById);

/* ---------- Admin-only ---------- */
router.use(requireAdmin);

router
  .route('/')
  .get(getTasks)
  .post(
    [
      body('title').trim().notEmpty().withMessage('Title is required'),
      body('description').optional({ values: 'falsy' }).trim(),
      body('assignedTo')
        .custom((value) => {
          const list = Array.isArray(value) ? value : [value];
          if (list.length === 0) throw new Error('Select at least one intern');
          if (!list.every((id) => /^[a-f\d]{24}$/i.test(String(id)))) {
            throw new Error('Invalid intern selection');
          }
          return true;
        })
        .withMessage('Select at least one intern'),
      body('priority')
        .optional({ values: 'falsy' })
        .isIn(TASK_PRIORITIES)
        .withMessage('Invalid priority'),
      body('dueDate')
        .notEmpty()
        .withMessage('Due date is required')
        .isISO8601()
        .withMessage('Due date must be a valid date'),
    ],
    validate,
    createTask
  );

router
  .route('/:id')
  .put(
    [
      idParam,
      body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
      body('description').optional({ values: 'falsy' }).trim(),
      body('assignedTo').optional().isMongoId().withMessage('Invalid intern'),
      body('priority')
        .optional({ values: 'falsy' })
        .isIn(TASK_PRIORITIES)
        .withMessage('Invalid priority'),
      body('dueDate')
        .optional({ values: 'falsy' })
        .isISO8601()
        .withMessage('Due date must be a valid date'),
    ],
    validate,
    updateTask
  )
  .delete([idParam], validate, deleteTask);

export default router;
