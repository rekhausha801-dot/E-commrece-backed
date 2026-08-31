const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://danish222004:Sanjay123*@cluster0.vnldimk.mongodb.net/e-commerce').then(async () => {
  const Order = require('./models/Order.js').default; // Assuming it's ESM, wait, this is CJS or ESM?
  // Actually, I'll just look at the code!
});
