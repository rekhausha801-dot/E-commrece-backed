import express from 'express';
import {
  getOrders,
  getOrderStats,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  cancelOrder,
  processReturn,
  processRefund,
  exportOrders,
  getMyOrders
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Stats and Export should be before /:id so they don't get caught as an ID
router.route('/stats').get(protect, admin, getOrderStats);
router.route('/export').get(protect, admin, exportOrders);
router.route('/myorders').get(protect, getMyOrders);

router.route('/')
  .get(protect, admin, getOrders)
  .post(protect, createOrder);

router.route('/:id')
  .get(protect, getOrderById)
  .put(protect, admin, updateOrder)
  .delete(protect, admin, deleteOrder);

router.route('/:id/status').patch(protect, admin, updateOrderStatus);
router.route('/:id/cancel').patch(protect, cancelOrder);
router.route('/:id/return').patch(protect, processReturn);
router.route('/:id/refund').patch(protect, admin, processRefund);

export default router;
