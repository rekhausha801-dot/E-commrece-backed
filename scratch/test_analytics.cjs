const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';
mongoose.connect(mongoUri).then(async () => {
  const usersCount = await mongoose.connection.collection('users').countDocuments({ role: { $ne: 'admin' } });
  const customersCount = await mongoose.connection.collection('customers').countDocuments();
  const ordersCount = await mongoose.connection.collection('orders').countDocuments();
  const productsCount = await mongoose.connection.collection('products').countDocuments();

  console.log('Stats Check:', { usersCount, customersCount, ordersCount, productsCount });
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
