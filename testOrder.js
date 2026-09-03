import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const testCheckout = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce');
    
    // Find any user
    const db = mongoose.connection.db;
    const user = await db.collection('users').findOne({});
    if (!user) {
      console.log('No user found');
      process.exit(1);
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '30d' });

    // Find any address
    const addressDoc = await db.collection('addresses').findOne({});
    const addressId = addressDoc?.addresses?.[0]?._id;

    // Send payload
    const payload = {
      checkoutType: 'cart',
      items: [{
        productId: '6411b9a9b9a9b9a9b9a9b9a9',
        productName: 'Test Product',
        quantity: 1,
        size: 'M',
        color: 'Red',
        customText: 'Hello',
        customTextColor: '#000000',
        customTextFont: 'Arial',
        selectedDesign: null,
        selectedDesignColor: null,
        colorizeImage: false
      }],
      addressId: addressId || '6411b9a9b9a9b9a9b9a9b9a9',
      paymentMethod: {
        type: 'cod',
        label: 'Cash on Delivery',
        method: ''
      },
      couponCode: '',
      couponDiscount: 0
    };

    try {
      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      console.log('STATUS:', response.status);
      console.log('RESPONSE:', data);
    } catch (err) {
      console.log('FETCH ERROR:', err);
    }

    process.exit(0);
  } catch (err) {
    console.error('SCRIPT ERROR:', err);
    process.exit(1);
  }
};

testCheckout();
