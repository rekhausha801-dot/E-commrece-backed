const mongoose = require('mongoose');

async function fix() {
  await mongoose.connect('mongodb://janani:janu12345@ac-zvb8pli-shard-00-00.vnldimk.mongodb.net:27017,ac-zvb8pli-shard-00-01.vnldimk.mongodb.net:27017,ac-zvb8pli-shard-00-02.vnldimk.mongodb.net:27017/ecommerce?ssl=true&replicaSet=atlas-yom251-shard-0&authSource=admin&appName=Cluster0');
  const db = mongoose.connection.db;
  const result = await db.collection('users').updateOne({ email: 'rathi@gmail.com' }, { $set: { phoneNumber: '' } });
  console.log('Fixed DB:', result);
  process.exit(0);
}

fix();
