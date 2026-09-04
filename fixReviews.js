import mongoose from 'mongoose';
import Review from './models/Review.js';

mongoose.connect('mongodb://janani:janu12345@ac-zvb8pli-shard-00-00.vnldimk.mongodb.net:27017,ac-zvb8pli-shard-00-01.vnldimk.mongodb.net:27017,ac-zvb8pli-shard-00-02.vnldimk.mongodb.net:27017/ecommerce?ssl=true&replicaSet=atlas-yom251-shard-0&authSource=admin&appName=Cluster0').then(async () => {
  const reviews = await Review.find({});
  let fixed = 0;
  for (let r of reviews) {
    if (r.images && r.images.length > 1) {
      r.images = [r.images[r.images.length - 1]]; // Keep the latest image
      await r.save();
      fixed++;
    }
  }
  console.log('Fixed', fixed, 'reviews');
  mongoose.disconnect();
}).catch(console.error);
