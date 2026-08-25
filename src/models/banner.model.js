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
