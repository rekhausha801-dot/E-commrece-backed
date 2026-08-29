import SupportTicket from '../models/SupportTicket.model.js';
import { generateTicketNumber } from '../utils/generateTicketNumber.js';

export const createTicket = async (ticketData) => {
  const ticketNumber = await generateTicketNumber();
  const newTicket = new SupportTicket({
    ...ticketData,
    ticketNumber,
    status: 'open',
    actionRequired: false
  });
  return await newTicket.save();
};

export const updateTicketStatus = async (ticketId, status, user) => {
  const updateData = { status };
  if (status === 'resolved') {
    updateData.resolvedAt = new Date();
    updateData.resolvedBy = user._id;
    updateData.actionRequired = false;
  }
  return await SupportTicket.findByIdAndUpdate(ticketId, updateData, { new: true });
};
