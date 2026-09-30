const mongoose = require('mongoose');
mongoose.connect('mongodb://janani:janu12345@ac-zvb8pli-shard-00-00.vnldimk.mongodb.net:27017,ac-zvb8pli-shard-00-01.vnldimk.mongodb.net:27017,ac-zvb8pli-shard-00-02.vnldimk.mongodb.net:27017/ecommerce?ssl=true&replicaSet=atlas-yom251-shard-0&authSource=admin&appName=Cluster0').then(async () => {
  const users = await mongoose.connection.db.collection('customers').find({ $or: [{ profileImage: { $regex: 'plmgsllsgb' } }, { avatar: { $regex: 'plmgsllsgb' } }] }).toArray();
  console.log('Customers images:', users);
  
  const banners = await mongoose.connection.db.collection('banners').find({ image: { $regex: 'plmgsllsgb' } }).toArray();
  console.log('Banners images:', banners);

  process.exit(0);
});
