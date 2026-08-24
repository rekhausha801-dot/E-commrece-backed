import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema(
  {
    brandName: { type: String, required: true },
    brandSku: { type: String, required: true, unique: true },
    brandLogo: { type: String },
    galleryImages: [{ type: String }],
    description: { type: String },
    category: { type: String },
    status: { type: String, default: 'Active', enum: ['Active', 'Inactive'] },
    metaTitle: { type: String },
    metaDescription: { type: String }
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt
);

const Brand = mongoose.model('Brand', brandSchema);
export default Brand;
