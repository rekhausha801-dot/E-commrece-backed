import express from 'express';
import multer from 'multer';
import {
  submitReview,
  getProductReviews,
  getProductRatingSummary,
  markReviewHelpful,
  deleteCustomerReview
} from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Memory storage for multer since we upload directly to Cloudinary
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', protect, upload.array('images', 5), submitReview);
router.get('/product/:productId', getProductReviews);
router.get('/product/:productId/summary', getProductRatingSummary);
router.put('/:id/helpful', markReviewHelpful);
router.delete('/:id', protect, deleteCustomerReview);

export default router;
