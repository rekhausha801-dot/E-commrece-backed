import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB Connected');
  try {
    const result = await mongoose.connection.collection('reviews').dropIndex('product_1_user_1');
    console.log('Dropped index:', result);
  } catch (error) {
    console.log('Error dropping index (may not exist):', error.message);
  }
  process.exit();
})
.catch(err => {
  console.error(err);
  process.exit(1);
});
