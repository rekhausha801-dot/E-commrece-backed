import express from 'express';
import { validateCoupon, checkCouponUsage } from '../controllers/couponController.js';

const router = express.Router();

// Customer facing, but protected
router.post('/validate', validateCoupon);
router.post('/check-usage', checkCouponUsage);

export default router;
