import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    paymentId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    provider: {
      type: String,
      default: 'Simulated Gateway'
    },
    status: {
      type: String,
      enum: ['processing', 'paid', 'failed', 'refunded'],
      default: 'processing',
    },
    transactionId: {
      type: String,
    },
  },
  { timestamps: true }
);

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
