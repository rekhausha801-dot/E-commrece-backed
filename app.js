import customerNotificationRoutes from './routes/customerNotification.routes.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import productRoutes from './routes/productRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import subcategoryRoutes from './routes/subcategoryRoutes.js';
import brandRoutes from './routes/brandRoutes.js';
import offerRoutes from './routes/offerRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import bannerRoutes from './src/routes/banner.routes.js';
import orderRoutes from './routes/orderRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import adminReviewRoutes from './routes/adminReviewRoutes.js';
import checkoutRoutes from './routes/checkoutRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import shippingRoutes from './routes/shippingRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import preferencesRoutes from './routes/preferencesRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import supportDashboardRoutes from './routes/supportDashboard.routes.js';
import supportTicketRoutes from './routes/supportTicket.routes.js';
import adminTicketRoutes from './routes/adminTicket.routes.js';
import supportMessageRoutes from './routes/supportMessage.routes.js';
import faqRoutes from './routes/faq.routes.js';
import knowledgeBaseRoutes from './routes/knowledgeBase.routes.js';
import guideRoutes from './routes/guide.routes.js';
import supportSearchRoutes from './routes/supportSearch.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import customerAnalyticsRoutes from './routes/customerAnalytics.routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/subcategories', subcategoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin/reviews', adminReviewRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/payments', paymentRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }

  console.error(err);
  if (err instanceof require('multer').MulterError) {
    return res.status(400).json({ success: false, message: 'Upload error: ' + err.message });
  } else if (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
  next();
});

app.use('/api/shipping', shippingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/customer/notifications', customerNotificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin/settings/preferences', preferencesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin/reports', reportsRoutes);
app.use('/api/customer/analytics', customerAnalyticsRoutes);

// Help & Support Routes
app.use('/api/support/dashboard', supportDashboardRoutes);
app.use('/api/support/tickets', supportTicketRoutes);
app.use('/api/admin/support/tickets', adminTicketRoutes);
app.use('/api/support/tickets', supportMessageRoutes);
app.use('/api/admin/support/tickets', supportMessageRoutes); // To allow admin replies to /api/admin/support/tickets/:id/reply
app.use('/api', faqRoutes); // Mount at /api so /support/faqs and /admin/faqs can be configured in the route file
app.use('/api', knowledgeBaseRoutes);
app.use('/api', guideRoutes);
app.use('/api/support/search', supportSearchRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('E-Commerce API is running...');
});

export default app;
