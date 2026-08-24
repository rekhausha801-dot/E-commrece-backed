import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['All Offers', 'Women', 'Men', 'Kids', 'Ethnic Wear', 'Western Wear'],
    },
    badge: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    discountType: {
      type: String,
      required: true,
      enum: ['Percentage', 'Flat'],
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minPurchase: {
      type: Number,
      required: true,
      min: 0,
    },
    couponCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    image: {
      type: String,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: { type: Boolean, default: true }, isFirstOrderOnly: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Pre-save validation to ensure endDate is not before startDate
offerSchema.pre('save', function (next) {
  if (this.endDate < this.startDate) {
    next(new Error('End date cannot be before start date'));
  } else {
    next();
  }
});

const Offer = mongoose.model('Offer', offerSchema);

export default Offer;
