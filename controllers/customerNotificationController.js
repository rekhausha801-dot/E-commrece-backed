import Order from '../models/orderModel.js';

// @desc    Get notifications for the logged-in customer (derived from their orders)
// @route   GET /api/customer/notifications
// @access  Private (customer)
export const getCustomerNotifications = async (req, res) => {
  try {
    const customerId = req.user._id;

    // Fetch the latest 20 orders for this customer
    const orders = await Order.find({ 'customer.customerId': customerId })
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();

    // Convert order status changes into notification-like objects
    const notifications = orders.map((order) => {
      const status = order.orderStatus || 'Processing';

      const messageMap = {
        'Pending': `Your order ${order.orderNumber} has been placed and is pending confirmation.`,
        'Processing': `Your order ${order.orderNumber} is being processed.`,
        'Shipped': `Your order ${order.orderNumber} has been shipped.`,
        'Out for Delivery': `Your order ${order.orderNumber} is out for delivery.`,
        'Delivered': `Your order ${order.orderNumber} has been delivered successfully.`,
        'Cancelled': `Your order ${order.orderNumber} has been cancelled.`,
        'Return Requested': `Return request for order ${order.orderNumber} has been received.`,
        'Returned': `Your return for order ${order.orderNumber} has been processed.`,
      };

      const typeMap = {
        'Delivered': 'order',
        'Shipped': 'order',
        'Out for Delivery': 'order',
        'Cancelled': 'order',
        'Return Requested': 'return',
        'Returned': 'return',
        'Processing': 'order',
        'Pending': 'order',
      };

      return {
        _id: order._id,
        title: `Order ${status}`,
        message: messageMap[status] || `Order ${order.orderNumber} status: ${status}`,
        type: typeMap[status] || 'system',
        isRead: false,
        link: `/orders/${order._id}`,
        createdAt: order.updatedAt || order.createdAt,
      };
    });

    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching customer notifications:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark a customer notification as read (no-op — stored client-side)
// @route   PATCH /api/customer/notifications/:id/read
// @access  Private (customer)
export const markCustomerNotificationAsRead = async (req, res) => {
  res.json({ success: true, message: 'Notification marked as read' });
};

// @desc    Mark all customer notifications as read (no-op — stored client-side)
// @route   PATCH /api/customer/notifications/read-all
// @access  Private (customer)
export const markAllCustomerNotificationsAsRead = async (req, res) => {
  res.json({ success: true, message: 'All notifications marked as read' });
};
