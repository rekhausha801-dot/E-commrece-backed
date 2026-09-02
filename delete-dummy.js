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
    const dummyNames = ['ccvcxvcxv', 'hfhhhf', 'dffdfgg', 'sdsddsf'];
    const result = await Product.deleteMany({ name: { $in: dummyNames } });
    console.log(`Deleted ${result.deletedCount} dummy products from database.`);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

test();
