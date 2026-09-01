import { createCustomerNotification } from './customerNotification.controller.js';
import SupportTicket from '../models/SupportTicket.model.js';
import { createTicket, updateTicketStatus } from '../services/supportTicket.service.js';

// --- CUSTOMER APIs ---

export const createCustomerTicket = async (req, res) => {
  try {
    const { subject, description, category, priority, orderId } = req.body;
    
    if (!subject || !description || !category || !priority) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const ticketData = {
      user: req.user._id,
      customerName: req.user.name || 'Customer', // Fallback if name not in req.user
      customerEmail: req.user.email,
      subject,
      description,
      category,
      priority,
      orderId
    };

    const newTicket = await createTicket(ticketData);

    res.status(201).json({
      success: true,
      message: 'Support request created successfully',
      data: {
        ticketNumber: newTicket.ticketNumber
      }
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const contactSupport = async (req, res) => {
  try {
    const { subject, description, category, priority, orderId } = req.body;
    
    if (!subject || !description || !category || !priority) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const ticketData = {
      user: req.user._id,
      customerName: req.user.name || 'Customer', 
      customerEmail: req.user.email,
      subject,
      description,
      category,
      priority,
      orderId
    };

    const newTicket = await createTicket(ticketData);

    res.status(201).json({
      success: true,
      message: 'Support request created successfully',
      data: {
        ticketNumber: newTicket.ticketNumber
      }
    });
  } catch (error) {
    console.error('Error in contact support:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getCustomerTickets = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { status, priority, category } = req.query;

    const query = { user: req.user._id };
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;

    const tickets = await SupportTicket.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await SupportTicket.countDocuments(query);

    res.status(200).json({
      success: true,
      data: tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getCustomerTicketById = async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({ _id: req.params.id, user: req.user._id });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const updateCustomerTicket = async (req, res) => {
  try {
    const { subject, description, category, priority, attachments } = req.body;
    
    const ticket = await SupportTicket.findOne({ _id: req.params.id, user: req.user._id });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (subject) ticket.subject = subject;
    if (description) ticket.description = description;
    if (category) ticket.category = category;
    if (priority) ticket.priority = priority;
    if (attachments) ticket.attachments = attachments;

    await ticket.save();

    res.status(200).json({ success: true, message: 'Ticket updated successfully', data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// --- ADMIN APIs ---

export const getAllTickets = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { status, priority, category, assignedTo, ticketNumber } = req.query;

    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (assignedTo) query.assignedTo = assignedTo;
    if (ticketNumber) query.ticketNumber = new RegExp(ticketNumber, 'i');

    const tickets = await SupportTicket.find(query)
      .populate('user', 'name email')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await SupportTicket.countDocuments(query);

    res.status(200).json({
      success: true,
      data: tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getAdminTicketById = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('user', 'name email')
      .populate('assignedTo', 'name')
      .populate('resolvedBy', 'name');
      
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const changeTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await updateTicketStatus(req.params.id, status, req.user);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    res.status(200).json({ success: true, message: 'Status updated', data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const changeTicketPriority = async (req, res) => {
  try {
    const { priority } = req.body;
    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, { priority }, { new: true });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    res.status(200).json({ success: true, message: 'Priority updated', data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const assignTicket = async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, { assignedTo }, { new: true });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    res.status(200).json({ success: true, message: 'Ticket assigned', data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const updateActionRequired = async (req, res) => {
  try {
    const { actionRequired } = req.body;
    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, { actionRequired }, { new: true });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    res.status(200).json({ success: true, message: 'Action required updated', data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const resolveTicket = async (req, res) => {
  try {
    const { resolution } = req.body;
    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, {
      status: 'resolved',
      resolution,
      resolvedBy: req.user._id,
      resolvedAt: new Date(),
      actionRequired: false
    }, { new: true });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    
    // Notify customer about ticket resolution/reply
    await createCustomerNotification({
      user: ticket.user,
      type: 'Ticket',
      title: `Update on Support Ticket #${ticket.ticketNumber || ticket._id}`,
      message: `Your support ticket has been resolved: "${(resolution || '').substring(0, 50)}..."`,
      link: `/account/support`
    });
    
    res.status(200).json({ success: true, message: 'Ticket resolved', data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const escalateTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, {
      status: 'escalated',
      actionRequired: true
    }, { new: true });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    res.status(200).json({ success: true, message: 'Ticket escalated', data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
