import express from 'express';
import { getDashboardStats, getRatingBreakdown } from '../controllers/analyticsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', protect, admin, getDashboardStats);
router.get('/ratings', protect, admin, getRatingBreakdown);

export default router;
