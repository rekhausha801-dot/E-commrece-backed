import express from 'express';
import { createBuyNowCheckout, validatePaymentMethod, generateCheckoutSummary, getShippingFee } from '../controllers/checkoutController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/buy-now', createBuyNowCheckout);
router.post('/payment/validate', validatePaymentMethod);
router.post('/summary', protect, generateCheckoutSummary);
router.get('/shipping-fee', protect, getShippingFee);

export default router;
