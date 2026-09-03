const mongoose = require('mongoose');
const uri = 'mongodb://janani:janu12345@ac-zvb8pli-shard-00-00.vnldimk.mongodb.net:27017,ac-zvb8pli-shard-00-01.vnldimk.mongodb.net:27017,ac-zvb8pli-shard-00-02.vnldimk.mongodb.net:27017/ecommerce?ssl=true&replicaSet=atlas-yom251-shard-0&authSource=admin&appName=Cluster0';
mongoose.connect(uri).then(async () => {
  const Order = require('./models/orderModel.js').default;
  const order = await Order.findOne({'items.selectedDesign': { $ne: null }}).sort({createdAt: -1}).lean();
  console.log(JSON.stringify(order?.items?.[0] || 'no item found', null, 2));
  mongoose.disconnect();
}).catch(console.error);
