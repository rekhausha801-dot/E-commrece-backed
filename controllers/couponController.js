import Offer from '../models/offerModel.js';
import { calculateDiscount } from '../utils/discountCalculator.js';
import Order from '../models/orderModel.js';

// @desc    Validate a coupon code and calculate discount
// @route   POST /api/coupons/validate
// @access  Private/Customer
export const validateCoupon = async (req, res) => {
  try {
    const { code, cartTotal, email } = req.body;

    if (!code || cartTotal === undefined) {
      return res.status(400).json({ success: false, message: 'Coupon code and cart total are required' });
    }

    const offer = await Offer.findOne({ couponCode: code.toUpperCase() });

    if (!offer) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    if (!offer.isActive) {
      return res.status(400).json({ success: false, message: 'Coupon is not active' });
    }

    const currentDate = new Date();
    if (currentDate < offer.startDate) {
      return res.status(400).json({ success: false, message: 'Coupon is not valid yet' });
    }

    if (currentDate > offer.endDate) {
      return res.status(400).json({ success: false, message: 'Coupon has expired' });
    }

    
    if (offer.isFirstOrderOnly) {
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required to validate this first-order coupon' });
      }
      const previousOrders = await Order.countDocuments({ 'customer.email': email });
      if (previousOrders > 0) {
        return res.status(400).json({ success: false, message: 'This coupon is valid for first-time orders only' });
      }
    }

    if (email) {
      const previousCouponUsage = await Order.countDocuments({ 
        'customer.email': email, 
        'couponCode': { $ne: null, $exists: true, $ne: '' }
      });
      if (previousCouponUsage > 0) {
        return res.status(400).json({ success: false, message: 'You already used a coupon. Only one coupon can be used per customer.' });
      }
    }

    if (cartTotal < offer.minPurchase) {
      return res.status(400).json({ 
        success: false, 
        message: `Cart total must be at least ₹${offer.minPurchase} to use this coupon` 
      });
    }

    // Calculate discount
    const { discount, finalAmount } = calculateDiscount(cartTotal, offer.discountType, offer.discountValue);

    res.json({
      success: true,
      couponCode: offer.couponCode,
      discount,
      finalAmount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const checkCouponUsage = async (req, res) => {
  try {
    const { code, email } = req.body;
    if (!code || !email) {
      return res.status(400).json({ success: false, message: 'Coupon code and email are required' });
    }

    const previousCouponUsage = await Order.countDocuments({ 
      'customer.email': email, 
      'couponCode': { $ne: null, $exists: true, $ne: '' }
    });

    if (previousCouponUsage > 0) {
      return res.json({ success: true, used: true, message: 'You already used a coupon. Only one coupon can be used per customer.' });
    }

    res.json({ success: true, used: false });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
