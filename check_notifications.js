import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CustomerNotification from './models/CustomerNotification.model.js';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const notifications = await CustomerNotification.find();
  console.log('Total notifications:', notifications.length);
  
  const unread = await CustomerNotification.find({ isRead: false });
  console.log('Unread notifications:', unread.length);
  
  if (unread.length > 0) {
    console.log('Unread notification sample:', unread[0]);
  }
  
  mongoose.disconnect();
}).catch(console.error);
