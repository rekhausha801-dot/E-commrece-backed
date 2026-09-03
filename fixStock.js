import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const fixStock = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce');
    const db = mongoose.connection.db;
    
    // Update all products to have at least 100 stock
    const result = await db.collection('products').updateMany(
      {},
      { $set: { countInStock: 100 } }
    );
    
    console.log(`Updated ${result.modifiedCount} products to have 100 stock!`);
    process.exit(0);
  } catch (err) {
    console.error('SCRIPT ERROR:', err);
    process.exit(1);
  }
};

fixStock();
