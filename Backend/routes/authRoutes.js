import express from 'express';
import { body } from 'express-validator';

import {
  login,
  logout,
  getMe,
  changePassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = express.Router();

router.post(
  '/login',
  [
    // trim/lowercase only — NOT normalizeEmail(), which strips dots from
    // gmail addresses and would stop first.last@gmail.com from ever matching.
    body('email').trim().toLowerCase().isEmail().withMessage('A valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

router.post('/logout', protect, logout);

router.get('/me', protect, getMe);

router.put(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters')
      .matches(/\d/)
      .withMessage('New password must contain at least one number'),
  ],
  validate,
  changePassword
);

export default router;
