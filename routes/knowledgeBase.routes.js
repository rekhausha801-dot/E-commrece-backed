import express from 'express';
import { getArticles, getArticleBySlug, articleFeedback, createArticle, updateArticle, deleteArticle } from '../controllers/knowledgeBase.controller.js';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// CUSTOMER ROUTES (/api/support/knowledge-base)
router.get('/support/knowledge-base', getArticles);
router.get('/support/knowledge-base/:slug', getArticleBySlug);
router.post('/support/knowledge-base/:id/feedback', articleFeedback);

// ADMIN ROUTES (/api/admin/knowledge-base)
router.post('/admin/knowledge-base', protect, admin, createArticle);
router.put('/admin/knowledge-base/:id', protect, admin, updateArticle);
router.delete('/admin/knowledge-base/:id', protect, admin, deleteArticle);

export default router;
