import mongoose from 'mongoose';

const supportMessageSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupportTicket',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderType: {
      type: String,
      enum: ['customer', 'admin', 'support'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    attachments: [
      {
        url: String,
        public_id: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const SupportMessage = mongoose.model('SupportMessage', supportMessageSchema);

export default SupportMessage;
