import express from 'express';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../controllers/notificationController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, admin, getNotifications);

router.route('/read-all')
  .patch(protect, admin, markAllAsRead);

router.route('/:id/read')
  .patch(protect, admin, markAsRead);

router.route('/:id')
  .delete(protect, admin, deleteNotification);

export default router;
