import express from 'express';

import {
  getAdminDashboard,
  getInternDashboard,
} from '../controllers/dashboardController.js';
import { protect, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/admin', requireAdmin, getAdminDashboard);
router.get('/intern', getInternDashboard);

export default router;
