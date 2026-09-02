import Order from '../models/orderModel.js';

export const getCustomerAnalytics = async (req, res) => {
  try {
    const customerId = req.user._id;

    // Sort by most recent
    const orders = await Order.find({ user: customerId }).sort({ createdAt: -1 });

    let totalOrders = orders.length;
    let totalSpent = 0;
    let pendingOrders = 0;
    let deliveredOrders = 0;
    let cancelledOrders = 0;
    let returnedOrders = 0;

    // For Monthly Spending Chart
    const spendingHistory = {};

    orders.forEach(order => {
      const status = order.orderStatus || 'Pending';
      const amount = (order.grandTotal || order.total || order.amount || 0);

      if (status === 'Delivered') {
        totalSpent += amount;
        deliveredOrders++;
      } else if (status === 'Pending' || status === 'Processing' || status === 'Shipped' || status === 'Confirmed') {
        pendingOrders++;
      } else if (status === 'Cancelled') {
        cancelledOrders++;
      } else if (status === 'Returned' || status === 'Refunded') {
        returnedOrders++;
      }

      // Monthly Spending (only delivered or pending)
      if (status !== 'Cancelled' && status !== 'Returned' && status !== 'Refunded') {
        const date = new Date(order.createdAt);
        const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        if (spendingHistory[monthYear]) {
          spendingHistory[monthYear] += amount;
        } else {
          spendingHistory[monthYear] = amount;
        }
      }
    });

    
    const spendingChartData = Object.keys(spendingHistory).map(key => ({
      name: key,
      spent: spendingHistory[key]
    })).reverse(); // Oldest first for chart

    res.json({
      success: true,
      data: {
        totalOrders,
        totalSpent,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
        returnedOrders,
        recentOrders: orders.slice(0, 5),
        spendingChartData,
        availableCoupons: 0,
        rewardPoints: 0
      }
    });
  } catch (error) {
    console.error('Customer Analytics Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch customer analytics' });
  }
};