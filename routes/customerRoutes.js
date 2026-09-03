import express from 'express';
import {
  getCustomers,
  getCustomerStats,
  getCustomerById,
  createCustomer,
  updateCustomer,
  updateCustomerStatus,
  deleteCustomer,
  sendMessageToCustomer
} from '../controllers/customerController.js';

const router = express.Router();

router.get('/stats', getCustomerStats);

router.route('/')
  .get(getCustomers)
  .post(createCustomer);

router.route('/:id')
  .get(getCustomerById)
  .put(updateCustomer)
  .delete(deleteCustomer);

router.patch('/:id/status', updateCustomerStatus);
router.post('/:id/message', sendMessageToCustomer);

export default router;