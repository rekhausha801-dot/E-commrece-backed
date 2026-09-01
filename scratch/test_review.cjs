const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';
mongoose.connect(mongoUri).then(async () => {
  const Product = (await import('../models/Product.js')).default;
  const Review = (await import('../models/Review.js')).default;
  const User = (await import('../models/User.js')).default;

  const product = await Product.findOne();
  const user = await User.findOne({ role: { $ne: 'admin' } });

  const filter = { product: product._id, user: user._id };
  const update = { rating: 5, title: 'Super quality', comment: 'Loved the fabric and fit!', status: 'approved', isVerifiedPurchase: true };
  const review = await Review.findOneAndUpdate(filter, update, { upsert: true, new: true });
  console.log('Review successfully created/updated in DB:', review._id);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
