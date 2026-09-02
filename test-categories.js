import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

import Category from './models/Category.js';
import SubCategory from './models/SubCategory.js';
import Product from './models/Product.js';

async function test() {
  try {
    const categories = await Category.find({});
    const subcats = await SubCategory.find({});
    
    console.log('--- Categories ---');
    categories.forEach(c => console.log(`- ${c.name} (${c._id})`));
    
    console.log('\n--- SubCategories ---');
    subcats.forEach(c => console.log(`- ${c.name} (Parent: ${c.category})`));
    
    console.log('\n--- Products by Category ---');
    const prodStats = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    console.log(prodStats);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

test();
