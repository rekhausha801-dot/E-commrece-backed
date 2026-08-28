import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  // General
  language: { type: String, default: 'English' },
  timezone: { type: String, default: 'IST' },
  dateFormat: { type: String, default: 'DD/MM/YYYY' },
  currency: { type: mongoose.Schema.Types.Mixed, default: { code: 'INR', symbol: '₹', name: 'Indian Rupee' } },
  dashboardView: { type: String, default: 'Analytics' },
  
  // Store
  storeStatus: { type: String, default: 'open' },
  allowNewOrders: { type: Boolean, default: true },
  guestCheckout: { type: Boolean, default: true },
  outOfStockVisibility: { type: Boolean, default: true },

  // Orders
  minOrder: { type: Number, default: 500 },
  autoCancel: { type: Number, default: 48 },
  returnWindow: { type: String, default: '7' },

  // Payments
  codEnabled: { type: Boolean, default: true },
  razorpayKey: { type: String },
  razorpaySecret: { type: String },
  stripePub: { type: String },
  stripeSec: { type: String },

  // Legal & Policies
  privacyPolicy: { type: String },
  terms: { type: String },
  refund: { type: String },

  // Taxes
  enableGst: { type: Boolean, default: true },
  taxIncluded: { type: Boolean, default: true },
  gstRate: { type: Number, default: 18 },

  // Notifications (Admin Alerts)
  notifyOrders: { type: Boolean, default: true },
  notifyPayments: { type: Boolean, default: true },
  notifyReviews: { type: Boolean, default: true },
  notifyCustomers: { type: Boolean, default: true },
  
  // System Notifications
  alertInventory: { type: Boolean, default: true },
  alertSystem: { type: Boolean, default: true },
  notifyEmail: { type: Boolean, default: true },
  notifyPush: { type: Boolean, default: false },

  // Reviews
  enableReviews: { type: Boolean, default: true },
  reviewApprovalRequired: { type: Boolean, default: true },
  allowReviewPhotos: { type: Boolean, default: true },

  // Coupons
  enableCoupons: { type: Boolean, default: true },
  maxDiscount: { type: Number, default: 2000 }
}, {
  timestamps: true
});

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
