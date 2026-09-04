import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title']
  },
  description: {
    type: String
  },
  type: {
    type: String,
    enum: ['with_text', 'without_text', 'video', 'text'],
    default: 'with_text'
  },
  placement: {
    type: String,
    default: 'Home - Hero'
  },
  textPosition: {
    type: String,
    enum: ['Left', 'Center', 'Right'],
    default: 'Center'
  },
  image: {
    type: String,
    required: function() { return this.type !== 'text'; }
  },
  link: {
    type: String
  },
  fontSize: {
    type: String
  },
  specialLayout: {
    type: Boolean,
    default: false
  },
  line1Text: { type: String, default: '' },
  line1Color: { type: String, default: '#ffffff' },
  line1Size: { type: String, default: '' },
  line1Font: { type: String, default: 'Montserrat, sans-serif' },
  line2Text: { type: String, default: '' },
  line2Color: { type: String, default: '#ffffff' },
  line2Size: { type: String, default: '' },
  line2Font: { type: String, default: 'Playfair Display, serif' },
  line3Text: { type: String, default: '' },
  line3Color: { type: String, default: '#ffffff' },
  line3Size: { type: String, default: '' },
  line3Font: { type: String, default: 'Inter, sans-serif' },
  status: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  }
}, {
  timestamps: true
});

const Banner = mongoose.model('Banner', bannerSchema);

export default Banner;
