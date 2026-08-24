import express from 'express';
import {
  createBanner,
  getBanners,
  getActiveBanners,
  updateBanner,
  deleteBanner,
  toggleBannerStatus
} from '../controllers/banner.controller.js';
import { protect } from '../middlewares/banner.middleware.js';
import imageUpload from '../middlewares/imageUpload.middleware.js';

const router = express.Router();

// Customer facing route - no auth required
router.get('/active', getActiveBanners);

// Admin routes - temporarily unprotected for testing
router.route('/')
  .get(getBanners)
  .post(imageUpload.single('image'), createBanner);

router.route('/:id')
  .put(imageUpload.single('image'), updateBanner)
  .delete(deleteBanner);

router.route('/:id/status')
  .patch(toggleBannerStatus);

export default router;
