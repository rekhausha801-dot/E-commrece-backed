import Order from '../models/orderModel.js';

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
    res.json({
      success: true,
      message: 'Order fetched successfully',
      data: order
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
    const { customer, products, items, amount, paymentMethod, paymentStatus, orderStatus } = req.body;
    let { orderId } = req.body;

    if (!customer || !products || products.length === 0 || !items || amount === undefined || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (!orderId) {
      orderId = 'ORD' + Math.floor(10000 + Math.random() * 90000); // Generate ORDXXXXX
    }

    const order = new Order({
      orderId,
      customer,
      products,
      items,
      amount,
      paymentMethod,
      paymentStatus: paymentStatus || 'Pending',
      orderStatus: orderStatus || 'Processing'
    });

    const createdOrder = await order.save();
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: createdOrder
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

    const allowedStatuses = ['Processing', 'Delivered', 'Cancelled'];
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
