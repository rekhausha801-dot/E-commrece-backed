import mongoose from 'mongoose';

const RouteChargeSchema = new mongoose.Schema({
  originCity: {
    type: String,
    required: true,
    trim: true,
  },
  destinationCity: {
    type: String,
    required: true,
    trim: true,
  },
  charge: {
    type: Number,
    required: true,
    min: 0,
  }
});

const ShippingSettingSchema = new mongoose.Schema({
  baseCharge: {
    type: Number,
    required: true,
    default: 99,
  },
  freeShippingThreshold: {
    type: Number,
    required: true,
    default: 999,
  },
  enableFreeShipping: {
    type: Boolean,
    required: true,
    default: true,
  },
  customRoutes: [RouteChargeSchema]
}, { timestamps: true });

const ShippingSetting = mongoose.model('ShippingSetting', ShippingSettingSchema);

export default ShippingSetting;
