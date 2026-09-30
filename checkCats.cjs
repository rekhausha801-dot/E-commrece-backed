const mongoose = require('mongoose');
mongoose.connect('mongodb://janani:janu12345@ac-zvb8pli-shard-00-00.vnldimk.mongodb.net:27017,ac-zvb8pli-shard-00-01.vnldimk.mongodb.net:27017,ac-zvb8pli-shard-00-02.vnldimk.mongodb.net:27017/ecommerce?ssl=true&replicaSet=atlas-yom251-shard-0&authSource=admin&appName=Cluster0').then(async () => {
  const cat = await mongoose.connection.db.collection('categories').find({}).toArray();
  console.log('Category images:', cat.map(c => c.image).filter(Boolean));
  
  const b = await mongoose.connection.db.collection('brands').find({}).toArray();
  console.log('Brand images:', b.map(c => c.image).filter(Boolean));
  process.exit(0);
});
