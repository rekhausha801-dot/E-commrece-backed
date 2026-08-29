import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['Order', 'Payment', 'Delivery', 'Product', 'Return', 'Refund', 'Account', 'Technical', 'Other'],
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'pending', 'resolved', 'escalated', 'closed'],
      default: 'open',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    attachments: [
      {
        url: String,
        public_id: String,
      },
    ],
    orderId: {
      type: String,
    },
    actionRequired: {
      type: Boolean,
      default: false,
    },
    adminReply: {
      type: String,
    },
    resolution: {
      type: String,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);


supportTicketSchema.index({ user: 1 });
supportTicketSchema.index({ status: 1 });
supportTicketSchema.index({ priority: 1 });
supportTicketSchema.index({ category: 1 });
supportTicketSchema.index({ assignedTo: 1 });
supportTicketSchema.index({ createdAt: -1 });

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

export default SupportTicket;
