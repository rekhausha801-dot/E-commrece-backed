import express from 'express';
import { getShippingSettings, updateShippingSettings, addCustomRoute, removeCustomRoute } from '../controllers/shippingController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/settings')
  .get(getShippingSettings)
  .put(protect, admin, updateShippingSettings);

router.route('/settings/routes')
  .post(protect, admin, addCustomRoute);

router.route('/settings/routes/:routeId')
  .delete(protect, admin, removeCustomRoute);

export default router;
