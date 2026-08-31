import mongoose from 'mongoose';

const customerNotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.Mixed, // Can be ObjectId or 'all' for broadcasts
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Collection', 'Ticket', 'Order', 'System']
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  link: {
    type: String
  }
}, {
  timestamps: true
});

const CustomerNotification = mongoose.model('CustomerNotification', customerNotificationSchema);
export default CustomerNotification;