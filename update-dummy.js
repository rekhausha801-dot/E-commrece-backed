import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

import Product from './models/Product.js';

async function test() {
  try {
    const kurtiCategoryId = '6a86f69a33e96d2504620e3b';
    const result = await Product.updateMany(
      { name: 'ccvcxvcxv' },
      { $set: { category: kurtiCategoryId } }
    );
    console.log(`Updated ${result.modifiedCount} dummy products to kurti category`);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

test();
