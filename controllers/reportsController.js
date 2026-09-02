import Order from '../models/orderModel.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

// @desc    Get admin reports/analytics
// @route   GET /api/admin/reports
// @access  Private/Admin
export const getAdminReports = async (req, res) => {
  try {
    const { startDate, endDate, period = 'daily' } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();
    // Set end to end of day
    end.setHours(23, 59, 59, 999);

    const dateFilter = { createdAt: { $gte: start, $lte: end } };

    // Total orders and revenue in period
    const orderStats = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$grandTotal' },
          totalDiscount: { $sum: { $add: ['$productDiscount', '$couponDiscount'] } },
          avgOrderValue: { $avg: '$grandTotal' },
        }
      }
    ]);

    // Delivered orders revenue
    const deliveredStats = await Order.aggregate([
      { $match: { ...dateFilter, orderStatus: 'Delivered' } },
      { $group: { _id: null, revenue: { $sum: '$grandTotal' }, count: { $sum: 1 } } }
    ]);

    // Order status breakdown
    const statusBreakdown = await Order.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$orderStatus', count: { $sum: 1 }, revenue: { $sum: '$grandTotal' } } },
      { $sort: { count: -1 } }
    ]);

    // Revenue by date (chart data)
    const groupByFormat = period === 'monthly' ? '%Y-%m' : period === 'weekly' ? '%Y-%U' : '%Y-%m-%d';
    const revenueByDate = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $dateToString: { format: groupByFormat, date: '$createdAt' } },
          revenue: { $sum: '$grandTotal' },
          orders: { $sum: 1 },
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // New customers in period
    const newCustomers = await User.countDocuments({
      role: { $ne: 'admin' },
      createdAt: { $gte: start, $lte: end }
    });

    // Total customers
    const totalCustomers = await User.countDocuments({ role: { $ne: 'admin' } });

    // Top selling products in period
    const topProducts = await Order.aggregate([
      { $match: { ...dateFilter, orderStatus: { $nin: ['Cancelled'] } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          productName: { $first: '$items.productName' },
          totalQty: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' },
        }
      },
      { $sort: { totalQty: -1 } },
      { $limit: 5 }
    ]);

    // Payment method breakdown
    const paymentBreakdown = await Order.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$paymentMethod.type', count: { $sum: 1 }, revenue: { $sum: '$grandTotal' } } },
      { $sort: { count: -1 } }
    ]);

    // Total products
    const totalProducts = await Product.countDocuments();

    const summary = orderStats[0] || { totalOrders: 0, totalRevenue: 0, totalDiscount: 0, avgOrderValue: 0 };
    const delivered = deliveredStats[0] || { revenue: 0, count: 0 };

    res.json({
      success: true,
      data: {
        summary: {
          totalOrders: summary.totalOrders || 0,
          totalRevenue: summary.totalRevenue || 0,
          totalDiscount: summary.totalDiscount || 0,
          avgOrderValue: Math.round(summary.avgOrderValue || 0),
          deliveredRevenue: delivered.revenue || 0,
          deliveredOrders: delivered.count || 0,
          newCustomers,
          totalCustomers,
          totalProducts,
        },
        revenueByDate,
        statusBreakdown,
        topProducts,
        paymentBreakdown,
        period,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      }
    });

  } catch (error) {
    console.error('Error fetching admin reports:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export admin reports as CSV
// @route   GET /api/admin/reports/export
// @access  Private/Admin
export const exportAdminReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end }
    }).lean();

    // Build CSV
    const headers = ['Order Number', 'Date', 'Customer', 'Status', 'Payment', 'Grand Total', 'Discount'];
    const rows = orders.map(o => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleDateString('en-IN'),
      o.customer?.name || '',
      o.orderStatus,
      o.paymentMethod?.type || '',
      o.grandTotal,
      (o.productDiscount || 0) + (o.couponDiscount || 0),
    ]);

    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=reports_${startDate}_${endDate}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting reports:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
