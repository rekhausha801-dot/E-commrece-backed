import express from 'express';
import { getCustomerAnalytics } from '../controllers/customerAnalytics.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getCustomerAnalytics);

export default router;