import Product from '../models/Product.js';
import Address from '../models/Address.js';
import ShippingSetting from '../models/ShippingSetting.js';

// @desc    Generate Buy Now checkout payload
// @route   POST /api/checkout/buy-now
// @access  Public / Private (can be public for guests, or protect it)
export const createBuyNowCheckout = async (req, res) => {
  try {
    const { productId, size, color, quantity } = req.body;

    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Invalid product or quantity' });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.status !== 'Active') {
      return res.status(400).json({ success: false, message: 'Product is currently not available for purchase' });
    }

    if (product.sizes && product.sizes.length > 0 && !size) {
      return res.status(400).json({ success: false, message: 'Please select a size' });
    }

    if (product.colors && product.colors.length > 0 && !color) {
      return res.status(400).json({ success: false, message: 'Please select a color' });
    }

    if (product.countInStock < quantity) {
      return res.status(400).json({ success: false, message: `Only ${product.countInStock} items left in stock` });
    }

    // Pricing Calculation
    const originalPrice = product.price || 0;
    let discountAmount = 0;
    
    if (product.discount > 0) {
      if (product.discountType === 'Percentage') {
        discountAmount = (originalPrice * product.discount) / 100;
      } else {
        discountAmount = product.discount;
      }
    }

    const discountedPrice = originalPrice - discountAmount;
    
    const subtotal = originalPrice * quantity;
    const totalProductDiscount = discountAmount * quantity;
    
    // Using dummy shipping for buy now, ideally this would call getShippingFee logic too
    const shippingFee = 0; 
    
    const tax = (subtotal - totalProductDiscount) * 0.041;
    const couponDiscount = 0;

    const grandTotal = Math.max(0, subtotal - totalProductDiscount - couponDiscount + shippingFee + tax);

    // Get primary image
    const image = product.images && product.images.length > 0 ? product.images[0].url : '';

    return res.status(200).json({
      success: true,
      message: 'Buy Now checkout created successfully',
      checkoutType: 'buyNow',
      items: [
        {
          productId: product._id,
          productName: product.name,
          productImage: image,
          size: size || null,
          color: color || null,
          quantity: quantity,
          availableStock: product.countInStock,
          originalPrice: originalPrice,
          discountAmount: discountAmount,
          finalUnitPrice: discountedPrice,
          totalPrice: discountedPrice * quantity
        }
      ],
      pricing: {
        subtotal,
        productDiscount: totalProductDiscount,
        couponDiscount,
        shippingFee,
        tax,
        grandTotal: grandTotal
      }
    });

  } catch (error) {
    console.error('Buy Now Checkout Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Validate Payment Method
// @route   POST /api/checkout/payment/validate
// @access  Public / Private (can be public for guests)
export const validatePaymentMethod = async (req, res) => {
  try {
    const { paymentMethod } = req.body;

    if (!paymentMethod || !paymentMethod.type) {
      return res.status(400).json({ success: false, message: 'Payment method is required' });
    }

    const validTypes = ['cod', 'online', 'wallet'];
    if (!validTypes.includes(paymentMethod.type)) {
      return res.status(400).json({ success: false, message: 'Invalid payment method type selected' });
    }

    if (paymentMethod.type === 'online') {
      const validOnlineMethods = ['upi', 'card', 'netbanking'];
      if (!paymentMethod.method || !validOnlineMethods.includes(paymentMethod.method)) {
        return res.status(400).json({ success: false, message: 'Invalid or missing online payment method' });
      }
    }

    if (paymentMethod.type === 'wallet') {
      const validProviders = ['phonepe', 'paytm', 'googlepay', 'amazonpay'];
      if (!paymentMethod.provider || !validProviders.includes(paymentMethod.provider)) {
        return res.status(400).json({ success: false, message: 'Invalid or missing wallet provider' });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Payment method validated successfully',
      paymentMethod
    });
  } catch (error) {
    console.error('Payment Validation Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate Final Checkout Summary
// @route   POST /api/checkout/summary
// @access  Private
export const generateCheckoutSummary = async (req, res) => {
  try {
    const { checkoutType, items, addressId, paymentMethod } = req.body;
    
    // 1. User Validation (already done by protect middleware, req.user exists)
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // 2. Checkout Validation
    if (!['buyNow', 'cart'].includes(checkoutType)) {
      return res.status(400).json({ success: false, message: 'Invalid checkout type' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items provided for checkout' });
    }

    // 3. Product Validation & Pricing Calculation
    let subtotal = 0;
    let totalProductDiscount = 0;
    
    const pastOrderCount = await Order.countDocuments({ 'customer.customerId': req.user._id });
    
    // Fetch shipping settings
    const settings = await ShippingSetting.findOne() || { baseCharge: 50, freeShippingThreshold: 999, enableFreeShipping: true, customRoutes: [] };
    let shippingFee = settings.baseCharge;
    
    let tax = 0;
    let couponDiscount = 0; // Hardcoded to 0 for now as per phase 4
    
    const summaryItems = [];

    for (const item of items) {
      const { productId, size, color, quantity } = item;
      
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found: ${productId}` });
      }
      
      if (product.status !== 'Active') {
        return res.status(400).json({ success: false, message: `Product ${product.name} is no longer available` });
      }

      if (product.countInStock < quantity) {
        return res.status(400).json({ success: false, message: `Requested quantity for ${product.name} is no longer available. Only ${product.countInStock} left.` });
      }

      // Pricing logic
      const originalPrice = product.price || 0;
      let discountAmount = 0;
      
      if (product.discount > 0) {
        if (product.discountType === 'Percentage') {
          discountAmount = (originalPrice * product.discount) / 100;
        } else {
          discountAmount = product.discount;
        }
      }

      const finalUnitPrice = originalPrice - discountAmount;
      const itemTotalDiscount = discountAmount * quantity;
      const itemTotal = finalUnitPrice * quantity;
      
      // Calculate Item Level GST
      const gstRate = product.gstRate || 0;
      const priceIncludesGST = product.gstIncludedInPrice || false;
      let itemTaxableAmount = itemTotal; // Currently, no coupon discount distributed
      let itemGstAmount = 0;

      if (priceIncludesGST) {
        itemGstAmount = (itemTaxableAmount * gstRate) / (100 + gstRate);
      } else {
        itemGstAmount = (itemTaxableAmount * gstRate) / 100;
      }
      
      subtotal += (originalPrice * quantity);
      totalProductDiscount += itemTotalDiscount;
      tax += itemGstAmount; // Reusing 'tax' variable as totalGst for now, later changed to totalGst
      
      const image = product.images && product.images.length > 0 ? product.images[0].url : '';

      summaryItems.push({
        productId: product._id,
        productName: product.name,
        productImage: image,
        size: size || null,
        color: color || null,
        quantity: quantity,
        originalPrice: originalPrice,
        discountAmount: discountAmount,
        finalUnitPrice: finalUnitPrice,
        totalPrice: itemTotal, // Total before adding exclusive GST
        taxableAmount: itemTaxableAmount,
        gstRate: gstRate,
        gstAmount: itemGstAmount,
        priceIncludesGST: priceIncludesGST,
        itemTotalAfterGST: priceIncludesGST ? itemTotal : itemTotal + itemGstAmount,
        availableStock: product.countInStock
      });
    }

    // tax variable holds total GST
    let gstAmount = tax;
    let totalTaxableAmount = subtotal - totalProductDiscount - couponDiscount;
    let grandTotal = 0;

    // Summing it up correctly. If items are exclusive of GST, we add GST to grand total. 
    // Wait, some could be inclusive, some exclusive.
    // It's better to just sum the final item totals.
    const sumItemsFinal = summaryItems.reduce((acc, item) => acc + item.itemTotalAfterGST, 0);
    grandTotal = Math.max(0, sumItemsFinal - couponDiscount + shippingFee);

    // 4. Address Validation
    if (!addressId) {
      return res.status(400).json({ success: false, message: 'Delivery address is required' });
    }

    const address = await Address.findById(addressId);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Selected address not found' });
    }

    if (address.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Selected address belongs to another user' });
    }

    // Recalculate shipping based on address and settings
    if (pastOrderCount === 0) {
      shippingFee = 0;
    } else if (settings.enableFreeShipping && subtotal >= settings.freeShippingThreshold) {
      shippingFee = 0;
    } else {
      let routeCharge = null;
      if (address.city) {
        const userCity = address.city.toLowerCase();
        // Just assuming origin is 'default' or checking destination match
        const routeMatch = settings.customRoutes.find(r => r.destinationCity.toLowerCase() === userCity);
        if (routeMatch) {
          routeCharge = routeMatch.charge;
        }
      }
      shippingFee = routeCharge !== null ? routeCharge : settings.baseCharge;
    }

    const recalculatedGrandTotal = Math.max(0, sumItemsFinal - couponDiscount + shippingFee);

    // 5. Payment Validation
    if (!paymentMethod || !paymentMethod.type) {
      return res.status(400).json({ success: false, message: 'Payment method is required' });
    }

    const validTypes = ['cod', 'online', 'wallet'];
    if (!validTypes.includes(paymentMethod.type)) {
      return res.status(400).json({ success: false, message: 'Invalid payment method type selected' });
    }

    if (paymentMethod.type === 'online') {
      const validOnlineMethods = ['upi', 'card', 'netbanking'];
      if (!paymentMethod.method || !validOnlineMethods.includes(paymentMethod.method)) {
        return res.status(400).json({ success: false, message: 'Invalid or missing online payment method' });
      }
    }

    if (paymentMethod.type === 'wallet') {
      const validProviders = ['phonepe', 'paytm', 'googlepay', 'amazonpay'];
      if (!paymentMethod.provider || !validProviders.includes(paymentMethod.provider)) {
        return res.status(400).json({ success: false, message: 'Invalid or missing wallet provider' });
      }
    }
    
    // Label generation
    let paymentLabel = 'Unknown';
    if (paymentMethod.type === 'cod') paymentLabel = 'Cash on Delivery';
    else if (paymentMethod.type === 'online') {
      if (paymentMethod.method === 'upi') paymentLabel = 'UPI';
      if (paymentMethod.method === 'card') paymentLabel = 'Credit / Debit Card';
      if (paymentMethod.method === 'netbanking') paymentLabel = 'Net Banking';
    } else if (paymentMethod.type === 'wallet') {
      if (paymentMethod.provider === 'phonepe') paymentLabel = 'PhonePe';
      if (paymentMethod.provider === 'paytm') paymentLabel = 'Paytm';
      if (paymentMethod.provider === 'googlepay') paymentLabel = 'Google Pay';
      if (paymentMethod.provider === 'amazonpay') paymentLabel = 'Amazon Pay';
    }

    // 6. Return response
    return res.status(200).json({
      success: true,
      message: 'Checkout summary generated successfully',
      checkoutType,
      items: summaryItems,
      deliveryAddress: address,
      paymentMethod: {
        ...paymentMethod,
        label: paymentLabel
      },
      pricing: {
        subtotal,
        productDiscount: totalProductDiscount,
        couponDiscount,
        taxableAmount: totalTaxableAmount,
        gstAmount,
        shippingFee,
        tax: gstAmount, // keeping tax for backwards compatibility with legacy frontend parts temporarily
        grandTotal: recalculatedGrandTotal
      }
    });

  } catch (error) {
    console.error('Generate Checkout Summary Error:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Get dynamic shipping fee based on user order history and settings
// @route   GET /api/checkout/shipping-fee
// @access  Private
import Order from '../models/orderModel.js';
export const getShippingFee = async (req, res) => {
  try {
    const { subtotal, city } = req.query;
    const settings = await ShippingSetting.findOne() || { baseCharge: 50, freeShippingThreshold: 999, enableFreeShipping: true, customRoutes: [] };
    
    let shippingFee = settings.baseCharge;
    const currentSubtotal = parseFloat(subtotal) || 0;

    if (settings.enableFreeShipping && currentSubtotal >= settings.freeShippingThreshold) {
      shippingFee = 0;
    } else if (city) {
      const routeMatch = settings.customRoutes.find(r => r.destinationCity.toLowerCase() === city.toLowerCase());
      if (routeMatch) {
        shippingFee = routeMatch.charge;
      }
    }

    // check if it's first order
    let isFirstOrder = false;
    if (req.user) {
      const pastOrderCount = await Order.countDocuments({ 'customer.customerId': req.user._id });
      isFirstOrder = pastOrderCount === 0;
    }
    
    if (isFirstOrder) {
      shippingFee = 0;
    }

    res.status(200).json({ success: true, shippingFee, isFirstOrder });
  } catch (error) {
    console.error('Get Shipping Fee Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
