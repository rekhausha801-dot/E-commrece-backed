import Payment from '../models/Payment.js';
import Product from '../models/Product.js';

// @desc    Process simulated online payment
// @route   POST /api/payments/process
// @access  Private
export const processPayment = async (req, res) => {
  try {
    const { checkoutType, items, paymentMethod, couponCode } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items provided for payment' });
    }

    if (paymentMethod.type !== 'online') {
      return res.status(400).json({ success: false, message: 'Invalid payment method for this endpoint' });
    }

    // 1. Recalculate Total
    let subtotal = 0;
    let productDiscount = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId || item.product);
      if (!product || product.status !== 'Active') {
        return res.status(400).json({ success: false, message: `Product ${item.name || 'Unknown'} is not available` });
      }

      const originalPrice = product.price;
      let discountAmount = 0;
      if (product.discount > 0) {
        if (product.discountType === 'percentage') {
          discountAmount = (originalPrice * product.discount) / 100;
        } else {
          discountAmount = product.discount;
        }
      }

      subtotal += originalPrice * item.quantity;
      productDiscount += discountAmount * item.quantity;
    }

    // Tax calculation
    const couponDiscount = 0; // Simulated coupon discount for now
    let tax = (subtotal - productDiscount) * 0.041; 
    if (tax < 0) tax = 0;
    
    let shippingFee = 0;
    const grandTotal = Math.max(0, subtotal - productDiscount - couponDiscount + tax + shippingFee);

    // 2. Simulate Payment Processing Delay (to look realistic)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Create simulated payment record
    const paymentId = 'PAY' + Math.floor(10000000 + Math.random() * 90000000);

    const payment = new Payment({
      user: req.user._id,
      paymentId,
      amount: grandTotal,
      currency: 'INR',
      paymentMethod: paymentMethod.method || 'online',
      provider: 'Simulated Gateway',
      status: 'paid', // Simulate success
      transactionId: 'TXN' + Date.now(),
    });

    await payment.save();

    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      payment: {
        paymentId: payment.paymentId,
        status: payment.status,
        amount: payment.amount,
        transactionId: payment.transactionId
      }
    });

  } catch (error) {
    console.error('Payment Error:', error);
    res.status(500).json({ success: false, message: 'Payment processing failed. Please try again.' });
  }
};
