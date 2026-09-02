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
    const suitsCategoryId = '6a86a90eb9911c5c1f7b3c29';
    const result = await Product.updateOne(
      { sku: 'CUST-005' },
      { $set: { category: suitsCategoryId } }
    );
    console.log(`Updated ${result.modifiedCount} product (SKU: CUST-005)`);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

test();
