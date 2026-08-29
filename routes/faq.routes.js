import express from 'express';
import { getFAQs, getFAQById, createFAQ, updateFAQ, deleteFAQ } from '../controllers/faq.controller.js';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// CUSTOMER ROUTES (/api/support/faqs)
router.get('/support/faqs', getFAQs);
router.get('/support/faqs/:id', getFAQById);

// ADMIN ROUTES (/api/admin/faqs)
router.post('/admin/faqs', protect, admin, createFAQ);
router.put('/admin/faqs/:id', protect, admin, updateFAQ);
router.delete('/admin/faqs/:id', protect, admin, deleteFAQ);

export default router;
