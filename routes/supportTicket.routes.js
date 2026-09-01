import express from 'express';
import { 
  createCustomerTicket, 
  contactSupport,
  getCustomerTickets, 
  getCustomerTicketById, 
  updateCustomerTicket,
  getAllTickets,
  getAdminTicketById,
  changeTicketStatus,
  changeTicketPriority,
  assignTicket,
  updateActionRequired,
  resolveTicket,
  escalateTicket
} from '../controllers/supportTicket.controller.js';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// CUSTOMER ROUTES (/api/support/tickets)
router.route('/')
  .post(protect, createCustomerTicket)
  .get(protect, getCustomerTickets);

router.post('/contact', protect, contactSupport);

router.route('/:id')
  .get(protect, getCustomerTicketById)
  .put(protect, updateCustomerTicket);

export default router;
