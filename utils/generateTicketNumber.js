import SupportTicket from '../models/SupportTicket.model.js';

/**
 * Generates a unique ticket number in the format TKT-YYYY-XXXXX
 * Example: TKT-2026-00001
 */
export const generateTicketNumber = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `TKT-${currentYear}-`;

  // Find the last ticket created this year
  const lastTicket = await SupportTicket.findOne({
    ticketNumber: new RegExp(`^${prefix}`)
  }).sort({ createdAt: -1 });

  let nextSequence = 1;

  if (lastTicket && lastTicket.ticketNumber) {
    // Extract the sequence number
    const sequencePart = lastTicket.ticketNumber.split('-')[2];
    const lastSequence = parseInt(sequencePart, 10);
    if (!isNaN(lastSequence)) {
      nextSequence = lastSequence + 1;
    }
  }

  // Format with leading zeros to 5 digits
  const formattedSequence = nextSequence.toString().padStart(5, '0');
  return `${prefix}${formattedSequence}`;
};
