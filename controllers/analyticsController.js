import Order from '../models/orderModel.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Review from '../models/Review.js';
import Notification from '../models/notificationModel.js';

export const getDashboardStats = async (req, res) => {
  try {
    const range = req.query.range || 'Last 7 Days';

    const now = new Date();
    let startDate = new Date();
    let prevStartDate = new Date();
    let prevEndDate = new Date();
    let groupByFormat = '%Y-%m-%d';

    if (range === 'Last 7 Days' || range === '7d') {
      startDate.setDate(now.getDate() - 7);
      prevStartDate.setDate(startDate.getDate() - 7);
      prevEndDate = new Date(startDate);
    } else if (range === 'Last 30 Days' || range === '30d') {
      startDate.setDate(now.getDate() - 30);
      prevStartDate.setDate(startDate.getDate() - 30);
      prevEndDate = new Date(startDate);
    } else if (range === 'Last 6 Months' || range === '6m') {
      startDate.setMonth(now.getMonth() - 6);
      prevStartDate.setMonth(startDate.getMonth() - 6);
      prevEndDate = new Date(startDate);
      groupByFormat = '%Y-%m';
    } else if (range === 'This Year' || range === '12m') {
      startDate.setFullYear(now.getFullYear() - 1);
      prevStartDate.setFullYear(startDate.getFullYear() - 1);
      prevEndDate = new Date(startDate);
      groupByFormat = '%Y-%m';
    } else {
      startDate.setDate(now.getDate() - 7);
      prevStartDate.setDate(startDate.getDate() - 7);
      prevEndDate = new Date(startDate);
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const totalProducts = await Product.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const newCustomersToday = await User.countDocuments({ role: 'customer', createdAt: { $gte: todayStart } });

    const totalOrders = await Order.countDocuments();
    const newOrdersToday = await Order.countDocuments({ createdAt: { $gte: todayStart } });

    const validOrderStatuses = ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];

    const currentRevenueAggr = await Order.aggregate([
      { $match: { orderStatus: { $in: validOrderStatuses }, createdAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);
    const prevRevenueAggr = await Order.aggregate([
      { $match: { orderStatus: { $in: validOrderStatuses }, createdAt: { $gte: prevStartDate, $lt: prevEndDate } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);

    const totalRevenueAggrAllTime = await Order.aggregate([
      { $match: { orderStatus: { $in: validOrderStatuses } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);

    const totalRevenue = totalRevenueAggrAllTime.length ? totalRevenueAggrAllTime[0].total : 0;
    const currentPeriodRevenue = currentRevenueAggr.length ? currentRevenueAggr[0].total : 0;
    const prevPeriodRevenue = prevRevenueAggr.length ? prevRevenueAggr[0].total : 0;

    let revenuePercentageChange = 0;
    if (prevPeriodRevenue > 0) {
      revenuePercentageChange = ((currentPeriodRevenue - prevPeriodRevenue) / prevPeriodRevenue) * 100;
    } else if (currentPeriodRevenue > 0) {
      revenuePercentageChange = 100;
    }

    const chartAggr = await Order.aggregate([
      { $match: { orderStatus: { $in: validOrderStatuses }, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: groupByFormat, date: '$createdAt' } },
          total: { $sum: '$grandTotal' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const chartAggrMap = new Map(chartAggr.map(item => [item._id, item.total]));
    const labels = [];
    const values = [];

    if (range === 'Last 7 Days' || range === '7d' || range === 'Last 30 Days' || range === '30d') {
      let currDate = new Date(startDate);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      while (currDate <= end) {
        const dateStr = currDate.toISOString().split('T')[0];
        labels.push(dateStr);
        values.push(chartAggrMap.get(dateStr) || 0);
        currDate.setDate(currDate.getDate() + 1);
      }
    } else {
      let currDate = new Date(startDate);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      while (currDate <= end) {
        const monthStr = currDate.toISOString().substring(0, 7);
        if (!labels.includes(monthStr)) {
          labels.push(monthStr);
          values.push(chartAggrMap.get(monthStr) || 0);
        }
        currDate.setMonth(currDate.getMonth() + 1);
      }
    }

    const orderStatusCount = await Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
    ]);

    const lowStockItemsRaw = await Product.aggregate([
      {
        $addFields: {
          alertThreshold: { $ifNull: ['$lowStockAlert', 10] }
        }
      },
      {
        $match: {
          $expr: { $lte: ['$countInStock', '$alertThreshold'] }
        }
      },
      { $limit: 10 }
    ]);
    const lowStockCount = await Product.countDocuments({ countInStock: { $lt: 10 } });

    const topCategoriesAggr = await Order.aggregate([
      { $match: { orderStatus: { $in: validOrderStatuses }, createdAt: { $gte: startDate } } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: { path: '$productDetails', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'productDetails.category',
          foreignField: '_id',
          as: 'categoryDetails'
        }
      },
      { $unwind: { path: '$categoryDetails', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$categoryDetails.name', 'Uncategorized'] },
          value: { $sum: '$items.quantity' }
        }
      },
      { $sort: { value: -1 } },
      { $limit: 5 }
    ]);

    const totalCategorySold = topCategoriesAggr.reduce((acc, curr) => acc + curr.value, 0);
    const topCategories = topCategoriesAggr.map(cat => ({
      name: cat._id,
      value: totalCategorySold > 0 ? Math.round((cat.value / totalCategorySold) * 100) : 0,
      count: cat.value
    }));

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer.customerId', 'name email profileImage')
      .populate({
        path: 'items.product',
        select: 'name images category'
      })
      .lean();

    const topSellingProducts = await Product.find()
      .sort({ rating: -1, numReviews: -1 })
      .limit(5)
      .populate('category', 'name')
      .lean();

    const notifications = await Notification.find({ unread: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const newArrivals = await Product.find({})
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    const reviewStats = await Review.aggregate([
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      }
    ]);
    
    const totalReviewsCount = reviewStats.length > 0 ? reviewStats[0].totalReviews : 0;
    const avgRatingVal = reviewStats.length > 0 ? reviewStats[0].avgRating : 0;
    
    const premiumFabricCount = await Review.countDocuments({ 
      comment: { $regex: /fabric|quality|premium|material/i } 
    });
    
    const avgRatingFormatted = totalReviewsCount > 0 ? avgRatingVal.toFixed(1) : '0.0';

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          revenueChange: revenuePercentageChange,
          totalOrders,
          newOrdersToday,
          totalCustomers,
          newCustomersToday,
          totalProducts,
          lowStockCount
        },
        revenueOverview: {
          totalRevenue: currentPeriodRevenue,
          percentageChange: revenuePercentageChange,
          labels,
          values
        },
        ordersOverview: {
          totalOrders,
          statuses: orderStatusCount
        },
        lowStockItems: lowStockItemsRaw,
        topCategories,
        recentOrders,
        topSellingProducts,
        notifications,
        newArrivals,
        ratingsOverview: {
          totalReviews: totalReviewsCount,
          avgRating: avgRatingFormatted,
          fabricMentions: premiumFabricCount
        }
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getRatingBreakdown = async (req, res) => {
  try {
    const ratingStats = await Review.aggregate([
      {
        $group: {
          _id: { product: '$product', rating: '$rating' },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.product',
          totalReviews: { $sum: '$count' },
          ratings: {
            $push: {
              rating: '$_id.rating',
              count: '$count'
            }
          }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $project: {
          _id: 1,
          productName: '$productInfo.name',
          productImage: { $arrayElemAt: ['$productInfo.images', 0] },
          totalReviews: 1,
          ratings: 1
        }
      },
      { $sort: { totalReviews: -1 } }
    ]);

    const formattedStats = ratingStats.map(stat => {
      const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      stat.ratings.forEach(r => {
        breakdown[r.rating] = r.count;
      });

      return {
        productId: stat._id,
        productName: stat.productName,
        productImage: stat.productImage?.url || null,
        totalReviews: stat.totalReviews,
        percentages: {
          5: stat.totalReviews > 0 ? Math.round((breakdown[5] / stat.totalReviews) * 100) : 0,
          4: stat.totalReviews > 0 ? Math.round((breakdown[4] / stat.totalReviews) * 100) : 0,
          3: stat.totalReviews > 0 ? Math.round((breakdown[3] / stat.totalReviews) * 100) : 0,
          2: stat.totalReviews > 0 ? Math.round((breakdown[2] / stat.totalReviews) * 100) : 0,
          1: stat.totalReviews > 0 ? Math.round((breakdown[1] / stat.totalReviews) * 100) : 0,
        },
        counts: breakdown
      };
    });

    res.status(200).json({ success: true, data: formattedStats });
  } catch (error) {
    console.error('Error calculating rating breakdown:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
