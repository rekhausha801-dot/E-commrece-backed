import Order from '../models/orderModel.js';
import Product from '../models/Product.js';
import Address from '../models/Address.js';
import Payment from '../models/Payment.js';
import ShippingSetting from '../models/ShippingSetting.js';
// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ 'customer.customerId': req.user._id }).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all orders with search, filter, pagination
// @route   GET /api/orders
// @access  Private
export const getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { search, orderStatus, paymentStatus, paymentMethod } = req.query;

    let query = {};

    if (orderStatus) query.orderStatus = orderStatus;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (paymentMethod) query.paymentMethod = paymentMethod;

    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
        { 'products.productName': { $regex: search, $options: 'i' } },
      ];
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      message: 'Orders fetched successfully',
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard statistics for orders
// @route   GET /api/orders/stats
// @access  Private
export const getOrderStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          processing: {
            $sum: { $cond: [{ $eq: ['$orderStatus', 'Processing'] }, 1, 0] }
          },
          delivered: {
            $sum: { $cond: [{ $eq: ['$orderStatus', 'Delivered'] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$orderStatus', 'Cancelled'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats.length > 0 ? {
      totalOrders: stats[0].totalOrders,
      processing: stats[0].processing,
      delivered: stats[0].delivered,
      cancelled: stats[0].cancelled,
    } : {
      totalOrders: 0,
      processing: 0,
      delivered: 0,
      cancelled: 0,
    };

    res.json({
      success: true,
      message: 'Order statistics fetched successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    // Ensure the user is authorized to view this order
    if (order.customer && order.customer.customerId && order.customer.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }
    
    res.json({
      success: true,
      message: 'Order fetched successfully',
      data: order,
      order: order // added for frontend destructuring
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const { checkoutType, items, addressId, paymentMethod, paymentId } = req.body;

    if (!checkoutType || !items || items.length === 0 || !addressId || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'Missing required checkout information' });
    }

    if (paymentMethod.type === 'online' && !paymentId) {
      return res.status(400).json({ success: false, message: 'Payment ID is required for online payments' });
    }

    if (!['buyNow', 'cart'].includes(checkoutType)) {
      return res.status(400).json({ success: false, message: 'Invalid checkout type' });
    }

    // 1. Validate Address
    const address = await Address.findById(addressId);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    if (address.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized address usage' });
    }

    const addressSnapshot = {
      fullName: address.fullName,
      mobileNumber: address.mobileNumber,
      alternateMobileNumber: address.alternateMobileNumber,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      landmark: address.landmark,
      city: address.city,
      state: address.state,
      country: address.country,
      pincode: address.pincode,
      addressType: address.addressType
    };

    // 2. Fetch Products and Validate Stock
    let subtotal = 0;
    let productDiscount = 0;
    let totalItemsCount = 0;
    let tax = 0;
    const orderItems = [];
    const productsToUpdate = [];

    for (const item of items) {
      const product = await Product.findById(item.productId || item.product);
      if (!product || product.status !== 'Active') {
        return res.status(400).json({ success: false, message: `Product is unavailable or inactive.` });
      }

      if (product.countInStock < item.quantity) {
        return res.status(400).json({ success: false, message: `Only ${product.countInStock} items are currently available for ${product.name}.` });
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
      const itemTotalDiscount = discountAmount * item.quantity;
      const itemTotal = finalUnitPrice * item.quantity;
      
      const gstRate = product.gstRate || 0;
      const priceIncludesGST = product.gstIncludedInPrice || false;
      let itemTaxableAmount = itemTotal;
      let itemGstAmount = 0;

      if (priceIncludesGST) {
        itemGstAmount = (itemTaxableAmount * gstRate) / (100 + gstRate);
      } else {
        itemGstAmount = (itemTaxableAmount * gstRate) / 100;
      }

      subtotal += originalPrice * item.quantity;
      productDiscount += itemTotalDiscount;
      totalItemsCount += item.quantity;
      tax += itemGstAmount;

      orderItems.push({
        product: product._id,
        productName: product.name,
        productImage: product.images && product.images.length > 0 ? product.images[0].url : '',
        selectedSize: item.size || item.selectedSize || '',
        selectedColor: item.color || item.selectedColor || '',
        quantity: item.quantity,
        originalPrice,
        discountAmount,
        finalUnitPrice,
        totalPrice: itemTotal,
        taxableAmount: itemTaxableAmount,
        gstRate: gstRate,
        gstAmount: itemGstAmount,
        priceIncludesGST: priceIncludesGST,
        itemTotalAfterGST: priceIncludesGST ? itemTotal : itemTotal + itemGstAmount
      });
      
      productsToUpdate.push({ product, quantity: item.quantity });
    }

    // 3. Pricing
    const couponDiscount = 0; 
    let gstAmount = tax;
    let totalTaxableAmount = subtotal - productDiscount - couponDiscount;
    
    // Check if the user has past orders
    const pastOrderCount = await Order.countDocuments({ 'customer.customerId': req.user._id });
    
    // Fetch shipping settings
    const settings = await ShippingSetting.findOne() || { baseCharge: 50, freeShippingThreshold: 999, enableFreeShipping: true, customRoutes: [] };
    let shippingFee = settings.baseCharge;
    
    if (pastOrderCount === 0) {
      shippingFee = 0;
    } else if (settings.enableFreeShipping && subtotal >= settings.freeShippingThreshold) {
      shippingFee = 0;
    } else {
      let routeCharge = null;
      if (address.city) {
        const userCity = address.city.toLowerCase();
        const routeMatch = settings.customRoutes.find(r => r.destinationCity.toLowerCase() === userCity);
        if (routeMatch) {
          routeCharge = routeMatch.charge;
        }
      }
      shippingFee = routeCharge !== null ? routeCharge : settings.baseCharge;
    }

    const sumItemsFinal = orderItems.reduce((acc, item) => acc + item.itemTotalAfterGST, 0);
    const grandTotal = Math.max(0, sumItemsFinal - couponDiscount + shippingFee);

    // 3.5. Validate Payment if Online
    let finalPaymentStatus = 'Pending';
    if (paymentMethod.type === 'online') {
      const paymentRecord = await Payment.findOne({ paymentId });
      if (!paymentRecord) {
        return res.status(404).json({ success: false, message: 'Payment record not found' });
      }
      if (paymentRecord.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized payment usage' });
      }
      if (paymentRecord.status !== 'paid') {
        return res.status(400).json({ success: false, message: 'Payment not successful' });
      }
      finalPaymentStatus = 'Paid';
    }

    // 4. Update stock safely
    const successfulUpdates = [];
    try {
      for (const update of productsToUpdate) {
        const result = await Product.updateOne(
          { _id: update.product._id, countInStock: { $gte: update.quantity } },
          { $inc: { countInStock: -update.quantity } }
        );
        if (result.modifiedCount === 0) {
           throw new Error(`Stock verification failed for ${update.product.name} during final processing.`);
        }
        successfulUpdates.push(update);
      }
    } catch (err) {
      for (const rollback of successfulUpdates) {
         await Product.updateOne({ _id: rollback.product._id }, { $inc: { countInStock: rollback.quantity } });
      }
      return res.status(400).json({ success: false, message: err.message });
    }

    // 5. Create Order
    const orderNumber = 'ORD' + Math.floor(10000000 + Math.random() * 90000000); 

    const order = new Order({
      orderId: orderNumber, 
      orderNumber,
      checkoutType,
      customer: {
        customerId: req.user._id,
        name: req.user.name || address.fullName,
        email: req.user.email || 'customer@example.com'
      },
      items: orderItems,
      totalItemsCount,
      subtotal,
      productDiscount,
      couponDiscount,
      taxableAmount: totalTaxableAmount,
      shippingFee,
      tax: gstAmount,
      gstAmount: gstAmount,
      grandTotal,
      paymentMethod,
      paymentId: paymentMethod.type === 'online' ? paymentId : undefined,
      shippingAddress: addressSnapshot,
      paymentStatus: finalPaymentStatus,
      orderStatus: 'Pending'
    });

    const createdOrder = await order.save();
    
    // Trigger Admin Notification
    try {
      const { createNotification } = await import('./notificationController.js');
      await createNotification({
        type: 'Orders',
        title: 'New Order Received',
        desc: `Order #${createdOrder.orderId} has been placed by ${createdOrder.customer.name}`,
        meta: [`₹${createdOrder.grandTotal}`, `${createdOrder.totalItemsCount} Items`],
        priority: 'High',
        actionText: 'View Order'
      });
    } catch (notifErr) {
      console.error('Failed to trigger notification:', notifErr);
    }
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: createdOrder,
      order: createdOrder // Include this so frontend destructuring 'response.order._id' works if they use it
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Order ID already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private
export const updateOrder = async (req, res) => {
  try {
    const { customer, products, items, amount, paymentMethod, paymentStatus, orderStatus } = req.body;
    
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (customer) order.customer = customer;
    if (products) order.products = products;
    if (items !== undefined) order.items = items;
    if (amount !== undefined) order.amount = amount;
    if (paymentMethod) order.paymentMethod = paymentMethod;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (orderStatus) order.orderStatus = orderStatus;

    const updatedOrder = await order.save();
    res.json({
      success: true,
      message: 'Order updated successfully',
      data: updatedOrder
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;

    const allowedStatuses = ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Return Requested', 'Returned'];
    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid order status' });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.orderStatus = orderStatus;
    const updatedOrder = await order.save();
    
    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: updatedOrder
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel an order
// @route   PATCH /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req, res) => {
  try {
    let order;
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(req.params.id);
    }
    if (!order) {
      order = await Order.findOne({ $or: [{ orderId: req.params.id }, { orderNumber: req.params.id }] });
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify ownership or admin role
    if (order.customer.customerId && order.customer.customerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You are not authorized to cancel this order.' });
    }

    // Customer cancellation validations
    if (req.user.role !== 'admin') {
      if (!order.paymentMethod || order.paymentMethod.type.toLowerCase() !== 'cod') {
        return res.status(400).json({ success: false, message: 'Only Cash on Delivery orders can be cancelled.' });
      }

      if (!['Pending', 'Processing'].includes(order.orderStatus)) {
        return res.status(400).json({ success: false, message: 'This order can no longer be cancelled.' });
      }
    } else {
      // Admin can cancel anything except already cancelled/delivered/returned
      if (['Delivered', 'Cancelled', 'Returned'].includes(order.orderStatus)) {
        return res.status(400).json({ success: false, message: `Order cannot be cancelled. It is currently ${order.orderStatus}.` });
      }
    }

    if (order.orderStatus === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Order has already been cancelled.' });
    }

    // Restore stock
    for (const item of order.items) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { countInStock: item.quantity }
        });
      }
    }

    order.orderStatus = 'Cancelled';
    order.cancelledAt = new Date();
    order.cancelledBy = req.user.role === 'admin' ? 'admin' : 'customer';
    order.cancellationReason = req.body.cancellationReason || '';

    const updatedOrder = await order.save();

    // Trigger Admin Notification
    try {
      const { createNotification } = await import('./notificationController.js');
      await createNotification({
        type: 'Orders',
        title: 'Order Cancelled',
        desc: `Order #${updatedOrder.orderId} has been cancelled by ${updatedOrder.cancelledBy}. Reason: ${updatedOrder.cancellationReason || 'N/A'}`,
        meta: [`₹${updatedOrder.grandTotal}`],
        priority: 'High',
        actionText: 'View Order'
      });
    } catch (notifErr) {
      console.error('Failed to trigger cancellation notification:', notifErr);
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: updatedOrder
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Process return request
// @route   PATCH /api/orders/:id/return
// @access  Private
export const processReturn = async (req, res) => {
  try {
    const { returnStatus, reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.returnRequest = {
      status: returnStatus,
      reason: reason || order.returnRequest?.reason || ''
    };

    if (returnStatus === 'Approved') {
      order.orderStatus = 'Returned';
    }

    const updatedOrder = await order.save();

    res.json({
      success: true,
      message: 'Return request processed successfully',
      data: updatedOrder
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Process refund
// @route   PATCH /api/orders/:id/refund
// @access  Private
export const processRefund = async (req, res) => {
  try {
    const { refundStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.refundStatus = refundStatus;
    
    if (refundStatus === 'Processed') {
        order.paymentStatus = 'Refunded';
    }

    const updatedOrder = await order.save();

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: updatedOrder
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export Orders as CSV
// @route   GET /api/orders/export
// @access  Private
export const exportOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });

    const fields = ['Order ID', 'Customer Name', 'Email', 'Items', 'Amount', 'Payment Method', 'Payment Status', 'Order Status', 'Date'];
    
    let csvData = fields.join(',') + '\n';
    
    orders.forEach(order => {
        const row = [
            order.orderId,
            `"${order.customer?.name || ''}"`,
            order.customer?.email || '',
            order.items,
            order.amount,
            order.paymentMethod,
            order.paymentStatus,
            order.orderStatus,
            new Date(order.createdAt).toLocaleDateString('en-GB')
        ];
        csvData += row.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=orders_export.csv');
    res.status(200).send(csvData);

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    await Order.deleteOne({ _id: order._id });
    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
