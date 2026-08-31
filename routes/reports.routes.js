import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import * as reportsController from '../controllers/reports.controller.js';

const router = express.Router();



router.get('/', reportsController.getReports);
router.get('/summary', reportsController.getSummary);
router.get('/sales-overview', reportsController.getSalesOverview);
router.get('/sales-by-channel', reportsController.getSalesByChannel);
router.get('/revenue-breakdown', reportsController.getRevenueBreakdown);
router.get('/profit-margin', reportsController.getProfitMargin);
router.get('/returns-refunds', reportsController.getReturnsRefunds);
router.get('/coupon-performance', reportsController.getCouponPerformance);
router.get('/payment-methods', reportsController.getPaymentMethods);
router.get('/low-stock', reportsController.getLowStockOverview);
router.get('/customer-overview', reportsController.getCustomerOverview);
router.get('/order-status', reportsController.getOrderStatusOverview);
router.get('/export', reportsController.exportReports);

export default router;
