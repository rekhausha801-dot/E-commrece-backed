const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';
mongoose.connect(mongoUri).then(async () => {
  const users = await mongoose.connection.collection('users').find({ role: { $ne: 'admin' } }).toArray();
  console.log('Non-admin users count:', users.length);
  for (const u of users) {
    const existing = await mongoose.connection.collection('customers').findOne({ email: u.email });
    if (!existing) {
      await mongoose.connection.collection('customers').insertOne({
        name: u.fullName || u.email.split('@')[0],
        email: u.email,
        phone: u.phoneNumber || 'N/A',
        status: 'Active',
        createdAt: u.createdAt || new Date(),
        updatedAt: u.updatedAt || new Date()
      });
      console.log('Synced user to customer:', u.email);
    }
  }
  const custCount = await mongoose.connection.collection('customers').countDocuments();
  console.log('Total customers after sync:', custCount);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
