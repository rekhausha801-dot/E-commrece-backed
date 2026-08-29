import mongoose from 'mongoose';

const guideSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
    },
    steps: [
      {
        title: String,
        content: String,
        image: String,
      }
    ],
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
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


guideSchema.index({ category: 1 });
guideSchema.index({ status: 1 });

const Guide = mongoose.model('Guide', guideSchema);

export default Guide;
