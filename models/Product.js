import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  subCategory: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  numReviews: {
    type: Number,
    default: 0
  },
  images: [
    {
      url: String,
      alt: String,
      public_id: String
    }
  ],
  sizes: [String],
  colors: [String],
  countInStock: {
    type: Number,
    required: true,
    default: 0
  },
  // --- newly added missing fields ---
  sku: {
    type: String,
    unique: true
  },
  badge: {
    type: String,
    trim: true
  },
  shortDesc: {
    type: String
  },
  discountType: {
    type: String,
    enum: ['Percentage', 'Fixed'],
    default: 'Percentage'
  },
  costPrice: {
    type: Number,
    default: 0
  },
  lowStockAlert: {
    type: Number,
    default: 10
  },
  status: {
    type: String,
    enum: ['Active', 'Draft', 'Out of Stock'],
    default: 'Active'
  },
  tags: [String],
  specs: [{
    spec: String,
    val: String
  }],
  sizeGuide: [{
    size: String,
    bust: String,
    waist: String,
    length: String
  }],
  customizable: {
    type: Boolean,
    default: false
  },
  designs: [{
    id: String,
    name: String,
    icon: String,
    category: String,
    price: Number
  }],
  deliveryText: {
    type: String,
    default: 'Free Delivery on orders above ₹499'
  },
  returnText: {
    type: String,
    default: '7 days return policy'
  },
  warrantyText: {
    type: String,
    default: '100% secure checkout'
  },
  faqs: [{
    question: String,
    answer: String,
    status: {
      type: String,
      default: 'Active'
    }
  }],
  seoTitle: String,
  seoDesc: String,
  seoKeywords: String,
  homeSection: {
    type: String,
    enum: ['None', 'Trending', 'Limited Offers', 'New Arrivals', 'Best Sellers', 'Featured'],
    default: 'None'
  },
  limitedOfferDetails: {
    offerPrice: { type: Number },
    startDate: { type: Date },
    endDate: { type: Date },
    stockLimit: { type: Number }
  },
  isLimitedOffer: {
    type: Boolean,
    default: false
  },
  limitedOfferEndDate: {
    type: Date
  },
  relatedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }]
}, {
  timestamps: true
});

// Indexes for text search
productSchema.index({
  name: 'text',
  brand: 'text',
  subCategory: 'text'
}, {
  weights: {
    name: 10,
    brand: 5,
    subCategory: 2
  }
});

// Other useful indexes for filtering
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });

// Add custom validation for discount based on discountType
productSchema.pre('validate', function (next) {
  if (this.discount > 0) {
    if (this.discountType === 'Percentage' && this.discount > 100) {
      this.invalidate('discount', 'Percentage discount cannot exceed 100%');
    }
    if (this.discountType === 'Fixed' && this.discount > this.price) {
      this.invalidate('discount', 'Fixed discount cannot exceed the product price');
    }
  }
  next();
});

const Product = mongoose.model('Product', productSchema);

export default Product;
