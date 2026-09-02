import express from 'express';
import { getCustomerNotifications, markCustomerNotificationAsRead, markAllCustomerNotificationsAsRead } from '../controllers/customerNotificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Order: put specific routes before param routes
router.get('/', protect, getCustomerNotifications);
router.patch('/read-all', protect, markAllCustomerNotificationsAsRead);
router.patch('/:id/read', protect, markCustomerNotificationAsRead);

export default router;
