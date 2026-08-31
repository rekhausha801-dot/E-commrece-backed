import app from './app.js';
import connectDB from './config/db.js';
import customerNotificationRoutes from './routes/customerNotification.routes.js';

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
});