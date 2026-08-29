import SupportTicket from '../models/SupportTicket.model.js';

export const getDashboardStats = async () => {
  // Aggregate statistics based on tickets
  const totalTickets = await SupportTicket.countDocuments();
  
  const openTickets = await SupportTicket.countDocuments({ status: 'open' });
  const pendingTickets = await SupportTicket.countDocuments({ status: 'pending' });
  const resolvedTickets = await SupportTicket.countDocuments({ status: 'resolved' });
  const escalatedTickets = await SupportTicket.countDocuments({ status: 'escalated' });

  // Get start and end of today
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const newOpenTicketsToday = await SupportTicket.countDocuments({
    status: 'open',
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  });

  const pendingInReview = pendingTickets; // Based on requirements

  const escalatedActionRequired = await SupportTicket.countDocuments({
    status: 'escalated',
    actionRequired: true
  });

  const resolvedRate = totalTickets === 0 ? 0 : Math.round((resolvedTickets / totalTickets) * 100);

  return {
    openTickets,
    pendingTickets,
    resolvedTickets,
    escalatedTickets,
    newOpenTicketsToday,
    pendingInReview,
    resolvedRate,
    escalatedActionRequired
  };
};
