import express from 'express';
import {
  getAllReviews,
  getReviewStats,
  getReviewById,
  updateReviewStatus,
  deleteReview,
  replyToReview,
} from '../controllers/adminReviewController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, admin);

router.route('/')
  .get(getAllReviews);

router.route('/stats')
  .get(getReviewStats);

router.route('/:id')
  .get(getReviewById)
  .delete(deleteReview);

router.route('/:id/status')
  .patch(updateReviewStatus);

router.route('/:id/reply')
  .post(replyToReview);

export default router;
