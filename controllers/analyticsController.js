import Order from '../models/orderModel.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Review from '../models/Review.js';

export const getDashboardStats = async (req, res) => {
  try {
    // 1. Top level KPIs
    const totalProducts = await Product.countDocuments();
    const totalCustomers = await User.countDocuments({ role: { $in: ['user', 'customer'] } });
    const totalOrders = await Order.countDocuments();

    // Calculate total revenue from all Delivered orders
    const revenueAggregation = await Order.aggregate([
      { $match: { orderStatus: 'Delivered' } },
      { $group: { _id: null, totalRevenue: { $sum: '$grandTotal' } } }
    ]);
    const totalRevenue = revenueAggregation.length > 0 ? revenueAggregation[0].totalRevenue : 0;

    // 2. Order Status Breakdown
    const orderStatusBreakdown = await Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
    ]);

    // 3. Recent Orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer.customerId', 'name email profileImage')
      .lean();

    // 4. Top Selling Products (simple sort by numReviews for now, or you could aggregate from Order items)
    // Assuming 'numReviews' correlates with top selling for now
    const topSellingProducts = await Product.find()
      .sort({ numReviews: -1 })
      .limit(5)
      .select('name price countInStock images rating numReviews badge category')
      .lean();

    // 5. Low Stock Alerts
    const lowStockAlerts = await Product.find({ countInStock: { $lt: 10 } })
      .select('name countInStock lowStockAlert images category')
      .limit(5)
      .lean();

    // Return the consolidated data
    res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalProducts,
          totalCustomers,
          totalOrders,
          totalRevenue
        },
        orderStatusBreakdown,
        recentOrders,
        topSellingProducts,
        lowStockAlerts
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getRatingBreakdown = async (req, res) => {
  try {
    // Perform an aggregation to group reviews by product and then calculate rating percentages
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
        // Populate the product details (name, image)
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

    // Format the output to show percentages for 1 to 5 stars
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
