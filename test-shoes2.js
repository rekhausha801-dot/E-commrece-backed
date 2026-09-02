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
    const shoesCategoryId = '6a86a294b9911c5c1f7b3c1f';
    const products = await Product.find({ category: shoesCategoryId });
    console.log('--- Shoes Category Products ---');
    products.forEach(p => {
      console.log(`- ID: ${p._id}, Name: ${p.name}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

test();
