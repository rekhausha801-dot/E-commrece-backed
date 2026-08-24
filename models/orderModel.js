import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, required: true },
      email: { type: String, required: true },
    },
    products: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        productName: { type: String, required: true },
        productImage: { type: String },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    items: {
      type: Number,
      required: true,
      default: 0,
    },
    amount: {
      type: Number,
      required: true,
      default: 0.0,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
      default: 'Pending',
    },
    orderStatus: {
      type: String,
      enum: ['Processing', 'Delivered', 'Cancelled'],
      default: 'Processing',
    },
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
export default Order;
