import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

import Product from './models/Product.js';
import Category from './models/Category.js';

async function test() {
  try {
    const products = await Product.find({ name: { $regex: /fghg/i } }).populate('category');
    console.log('--- Problematic Products ---');
    products.forEach(p => {
      console.log(`- ${p.name}`);
      console.log(`  Category ID: ${p.category ? p.category._id : 'none'}`);
      console.log(`  Category Name: ${p.category ? p.category.name : 'none'}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

test();
