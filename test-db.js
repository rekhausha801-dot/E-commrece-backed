import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('DB Connected');
    console.log('User model removed, skipping query.');
    process.exit(0);
  })
  .catch(err => {
    console.error('DB Connection Error:', err);
    process.exit(1);
  });
