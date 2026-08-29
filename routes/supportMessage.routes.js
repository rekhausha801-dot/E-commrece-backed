import express from 'express';
import { getTicketMessages, replyToTicket } from '../controllers/supportMessage.controller.js';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Both Customer and Admin use these routes. The controller handles authorization.
// The base path will be /api/support/tickets or /api/admin/support/tickets

router.get('/:id/messages', protect, getTicketMessages);
router.post('/:id/reply', protect, replyToTicket);

export default router;
