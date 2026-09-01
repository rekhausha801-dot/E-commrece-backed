import express from 'express';
import { getDashboard } from '../controllers/supportDashboard.controller.js';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.get('/dashboard', protect, admin, getDashboard);

export default router;
