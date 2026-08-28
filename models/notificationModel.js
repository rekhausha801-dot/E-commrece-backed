import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['Orders', 'Returns', 'Payments', 'Reviews', 'Customers', 'System']
  },
  title: {
    type: String,
    required: true
  },
  desc: {
    type: String,
    required: true
  },
  meta: [{
    type: String
  }],
  priority: {
    type: String,
    required: true,
    enum: ['Low', 'Medium', 'High'],
    default: 'Low'
  },
  unread: {
    type: Boolean,
    default: true
  },
  actionText: {
    type: String
  },
  link: {
    type: String
  }
}, {
  timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
