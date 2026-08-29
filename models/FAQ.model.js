import mongoose from 'mongoose';

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    category: {
      type: String,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

faqSchema.index({ category: 1 });
faqSchema.index({ status: 1 });
faqSchema.index({ sortOrder: 1 });

const FAQ = mongoose.model('FAQ', faqSchema);

export default FAQ;
