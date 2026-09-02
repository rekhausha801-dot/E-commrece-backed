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
    const customTshirtsCategoryId = '6a9678617770109c83239bf5';
    const products = await Product.find({ category: customTshirtsCategoryId });
    console.log('--- Custom Tshirts Products ---');
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
