import express from 'express';
import { param } from 'express-validator';

import {
  getNotifications,
  markRead,
  markAllRead,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);

// Declared before '/:id/read' so 'read-all' is never parsed as an id.
router.patch('/read-all', markAllRead);

router.patch(
  '/:id/read',
  [param('id').isMongoId().withMessage('Invalid notification ID')],
  validate,
  markRead
);

export default router;
