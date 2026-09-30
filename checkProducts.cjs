const mongoose = require('mongoose');
mongoose.connect('mongodb://janani:janu12345@ac-zvb8pli-shard-00-00.vnldimk.mongodb.net:27017,ac-zvb8pli-shard-00-01.vnldimk.mongodb.net:27017,ac-zvb8pli-shard-00-02.vnldimk.mongodb.net:27017/ecommerce?ssl=true&replicaSet=atlas-yom251-shard-0&authSource=admin&appName=Cluster0').then(async () => {
  const p = await mongoose.connection.db.collection('products').find({}).toArray();
  console.log('Product images:', p.map(p => p.images).flat().filter(Boolean));
  process.exit(0);
});
