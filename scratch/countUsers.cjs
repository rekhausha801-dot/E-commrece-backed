const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const User = require('../models/User.js').default || require('../models/User.js');

async function count() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecommerce', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    console.log('TOTAL_USERS:', totalUsers);
    console.log('TOTAL_CUSTOMERS:', totalCustomers);
    console.log('TOTAL_ADMINS:', totalAdmins);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}
count();