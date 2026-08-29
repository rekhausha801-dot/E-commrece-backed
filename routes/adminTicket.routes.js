import express from 'express';
import { 
  getAllTickets,
  getAdminTicketById,
  changeTicketStatus,
  changeTicketPriority,
  assignTicket,
  updateActionRequired,
  resolveTicket,
  escalateTicket,
} from '../controllers/supportTicket.controller.js';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// ADMIN ROUTES (/api/admin/support/tickets)
router.route('/')
  .get(protect, admin, getAllTickets);

router.route('/:id')
  .get(protect, admin, getAdminTicketById);

router.put('/:id/status', protect, admin, changeTicketStatus);
router.put('/:id/priority', protect, admin, changeTicketPriority);
router.put('/:id/assign', protect, admin, assignTicket);
router.put('/:id/action-required', protect, admin, updateActionRequired);
router.post('/:id/resolve', protect, admin, resolveTicket);
router.post('/:id/escalate', protect, admin, escalateTicket);

export default router;
