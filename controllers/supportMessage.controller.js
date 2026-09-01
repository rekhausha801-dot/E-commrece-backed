import { createCustomerNotification } from './customerNotification.controller.js';
import SupportMessage from '../models/SupportMessage.model.js';
import SupportTicket from '../models/SupportTicket.model.js';

export const getTicketMessages = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Authorization check
    const ticket = await SupportTicket.findById(id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    
    const isAdmin = req.user.role === 'admin' || req.user.role === 'support';
    if (!isAdmin && ticket.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const messages = await SupportMessage.find({ ticket: id })
      .populate('sender', 'name email role')
      .sort({ createdAt: 1 });
      
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const replyToTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, attachments } = req.body;
    
    if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

    const ticket = await SupportTicket.findById(id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const isAdmin = req.user.role === 'admin' || req.user.role === 'support';
    
    if (!isAdmin && ticket.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const newMessage = new SupportMessage({
      ticket: id,
      sender: req.user._id,
      senderType: isAdmin ? 'admin' : 'customer',
      message,
      attachments
    });

    await newMessage.save();

    // If admin replies, we can optionally update ticket.adminReply
    if (isAdmin) {
      ticket.adminReply = message;
      await ticket.save();
      
      // Notify customer
      await createCustomerNotification({
        user: ticket.user,
        type: 'Ticket',
        title: `Update on Support Ticket #${ticket.ticketNumber || ticket._id}`,
        message: `An admin has replied to your support ticket: "${message.substring(0, 50)}..."`,
        link: `/account/support/${ticket._id}`
      });
    }

    res.status(201).json({ success: true, message: 'Reply sent successfully', data: newMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
