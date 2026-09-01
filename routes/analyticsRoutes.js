import express from 'express';
import { getDashboardStats, getRatingBreakdown } from '../controllers/analyticsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', getDashboardStats);
router.get('/ratings', getRatingBreakdown);

export default router;
