import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String, // Kept for backward compatibility, but we will use orderNumber going forward
      unique: true,
      sparse: true
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    checkoutType: {
      type: String,
      enum: ['buyNow', 'cart'],
      required: true
    },
    customer: {
      customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, required: true },
      email: { type: String, required: true },
    },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        productName: { type: String, required: true },
        productImage: { type: String },
        selectedSize: { type: String },
        selectedColor: { type: String },
        customText: { type: String, default: null },
        customTextColor: { type: String, default: null },
        customTextFont: { type: String, default: null },
        selectedDesign: { type: mongoose.Schema.Types.Mixed, default: null },
        selectedDesignColor: { type: String, default: null },
        colorizeImage: { type: Boolean, default: false },
        quantity: { type: Number, required: true },
        originalPrice: { type: Number, required: true },
        discountAmount: { type: Number, required: true, default: 0 },
        finalUnitPrice: { type: Number, required: true },
        totalPrice: { type: Number, required: true },
        taxableAmount: { type: Number, default: 0 },
        gstRate: { type: Number, default: 0 },
        gstAmount: { type: Number, default: 0 },
        priceIncludesGST: { type: Boolean, default: false },
        itemTotal: { type: Number, default: 0 }
      },
    ],
    totalItemsCount: {
      type: Number,
      required: true,
      default: 0,
    },
    subtotal: { type: Number, required: true },
    productDiscount: { type: Number, default: 0 },
    couponDiscount: { type: Number, default: 0 },
    taxableAmount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    couponCode: { type: String, default: null },
    channel: { type: String, default: 'Website' },
    paymentMethod: {
      type: { type: String, required: true }, // e.g. cod, online, wallet
      method: { type: String },
      provider: { type: String },
      label: { type: String }
    },
    paymentId: {
      type: String, // To link with the Payment model
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending',
    },
    orderStatus: {
      type: String,
      enum: ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Return Requested', 'Returned'],
      default: 'Processing',
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    cancelledBy: {
      type: String,
      enum: ['customer', 'admin'],
      default: null
    },
    cancellationReason: {
      type: String,
      default: ''
    },
    shippingAddress: {
      fullName: String,
      mobileNumber: String,
      alternateMobileNumber: String,
      addressLine1: String,
      addressLine2: String,
      landmark: String,
      city: String,
      state: String,
      country: String,
      pincode: String,
      addressType: String
    },
    returnRequest: {
      status: { type: String, enum: ['None', 'Requested', 'Approved', 'Rejected'], default: 'None' },
      reason: { type: String, default: '' },
    },
    refundStatus: {
      type: String,
      enum: ['None', 'Pending', 'Processed', 'Failed'],
      default: 'None',
    },
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
export default Order;
