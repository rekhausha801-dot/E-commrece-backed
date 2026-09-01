const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';
mongoose.connect(mongoUri).then(async () => {
  const Review = (await import('../models/Review.js')).default;
  const { updateProductRating } = await import('../services/reviewRatingService.js');

  const res = await Review.updateMany({}, { status: 'approved' });
  console.log('Updated reviews to approved:', res.modifiedCount);

  const reviews = await Review.find();
  const productIds = [...new Set(reviews.map(r => r.product.toString()))];
  for (const pid of productIds) {
    await updateProductRating(new mongoose.Types.ObjectId(pid));
    console.log('Recalculated rating for product:', pid);
  }
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
