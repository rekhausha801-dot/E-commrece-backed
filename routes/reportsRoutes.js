import express from 'express';
import { getAdminReports, exportAdminReports } from '../controllers/reportsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/export', protect, admin, exportAdminReports);
router.get('/', protect, admin, getAdminReports);

export default router;
