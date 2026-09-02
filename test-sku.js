import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

import Product from './models/Product.js';
import { generateUniqueSku } from './controllers/productController.js';

async function test() {
  const productsWithPrefix = await Product.find({ sku: new RegExp('^KURT-', 'i') }, { sku: 1 });
  console.log('Products:', productsWithPrefix);
  
  let maxNum = 0;
  for (const p of productsWithPrefix) {
    if (p.sku) {
      const parts = p.sku.split('-');
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }
  console.log('MaxNum:', maxNum);
  process.exit(0);
}

test();
