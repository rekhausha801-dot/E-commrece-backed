import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/E-Commerce').then(async () => {
  const db = mongoose.connection.db;
  console.log('Orders:', await db.collection('orders').countDocuments());
  console.log('Products:', await db.collection('products').countDocuments());
  console.log('Users:', await db.collection('users').countDocuments());
  
  console.time('agg');
  const res = await db.collection('orders').aggregate([
      { $match: { orderStatus: { $in: ['Delivered'] } } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $limit: 1 }
  ]).toArray();
  console.timeEnd('agg');

  process.exit(0);
});
