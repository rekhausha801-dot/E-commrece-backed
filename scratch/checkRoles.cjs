const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const User = require('../models/User.js').default || require('../models/User.js');

async function count() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    const roles = await User.distinct('role');
    console.log('Roles:', roles);
    
    const userCount = await User.countDocuments({ role: 'user' });
    const customerCount = await User.countDocuments({ role: 'customer' });
    console.log('Role user count:', userCount);
    console.log('Role customer count:', customerCount);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}
count();
