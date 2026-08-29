import mongoose from 'mongoose';

const knowledgeBaseSchema = new mongoose.Schema(
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
    tags: [String],
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    views: {
      type: Number,
      default: 0,
    },
    helpfulCount: {
      type: Number,
      default: 0,
    },
    notHelpfulCount: {
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


knowledgeBaseSchema.index({ category: 1 });
knowledgeBaseSchema.index({ status: 1 });
knowledgeBaseSchema.index({ tags: 1 });

const KnowledgeBase = mongoose.model('KnowledgeBase', knowledgeBaseSchema);

export default KnowledgeBase;
