import express from 'express';
import { getGuides, getGuideBySlug, createGuide, updateGuide, deleteGuide } from '../controllers/guide.controller.js';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// CUSTOMER ROUTES (/api/support/guides)
router.get('/support/guides', getGuides);
router.get('/support/guides/:slug', getGuideBySlug);

// ADMIN ROUTES (/api/admin/guides)
router.post('/admin/guides', protect, admin, createGuide);
router.put('/admin/guides/:id', protect, admin, updateGuide);
router.delete('/admin/guides/:id', protect, admin, deleteGuide);

export default router;
