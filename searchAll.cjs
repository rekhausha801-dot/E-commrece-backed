const mongoose = require('mongoose');
mongoose.connect('mongodb://janani:janu12345@ac-zvb8pli-shard-00-00.vnldimk.mongodb.net:27017,ac-zvb8pli-shard-00-01.vnldimk.mongodb.net:27017,ac-zvb8pli-shard-00-02.vnldimk.mongodb.net:27017/ecommerce?ssl=true&replicaSet=atlas-yom251-shard-0&authSource=admin&appName=Cluster0').then(async () => {
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    const docs = await collection.find({}).toArray();
    for (let doc of docs) {
      if (JSON.stringify(doc).includes('plmgsllsgb0f4mhryuhn')) {
        console.log('Found in collection:', collection.collectionName);
        console.log('Doc ID:', doc._id);
        console.log(JSON.stringify(doc, null, 2));
      }
    }
  }
  process.exit(0);
});
