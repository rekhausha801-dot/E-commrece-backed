import Order from '../models/orderModel.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { getAggregationFormat } from '../utils/dateRange.js';

const getValidOrderMatch = (start, end) => ({
  createdAt: { $gte: start, $lte: end },
  orderStatus: { $nin: ['Cancelled', 'Returned'] }
});

export const getSummaryReport = async (currentDates, previousDates) => {
  const currentMatch = getValidOrderMatch(currentDates.start, currentDates.end);
  const prevMatch = getValidOrderMatch(previousDates.start, previousDates.end);

  const [currentStats, prevStats, currCustCount, prevCustCount] = await Promise.all([
    Order.aggregate([
      { $match: currentMatch },
      { $group: { _id: null, totalSales: { $sum: '$grandTotal' }, totalOrders: { $sum: 1 } } }
    ]),
    Order.aggregate([
      { $match: prevMatch },
      { $group: { _id: null, totalSales: { $sum: '$grandTotal' }, totalOrders: { $sum: 1 } } }
    ]),
    User.countDocuments({ role: { $in: ['user', 'customer'] }, createdAt: { $lte: currentDates.end } }),
    User.countDocuments({ role: { $in: ['user', 'customer'] }, createdAt: { $lte: previousDates.end } })
  ]);

  const currSales = currentStats[0]?.totalSales || 0;
  const currOrders = currentStats[0]?.totalOrders || 0;
  
  const currAvg = currOrders > 0 ? currSales / currOrders : 0;

  const prevSales = prevStats[0]?.totalSales || 0;
  const prevOrders = prevStats[0]?.totalOrders || 0;
  
  const prevAvg = prevOrders > 0 ? prevSales / prevOrders : 0;

  const calcGrowth = (curr, prev) => prev === 0 ? (curr > 0 ? 100 : 0) : Number((((curr - prev) / prev) * 100).toFixed(1));

  return {
    totalSales: currSales,
    totalOrders: currOrders,
    totalCustomers: currCustCount,
    averageOrderValue: Math.round(currAvg),
    salesGrowth: calcGrowth(currSales, prevSales),
    ordersGrowth: calcGrowth(currOrders, prevOrders),
    customersGrowth: calcGrowth(currCustCount, prevCustCount),
    averageOrderValueGrowth: calcGrowth(currAvg, prevAvg)
  };
};

export const getSalesOverview = async (currentDates, period) => {
  const match = getValidOrderMatch(currentDates.start, currentDates.end);
  const dateFormat = getAggregationFormat(period);

  const results = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: dateFormat._id,
        sales: { $sum: '$grandTotal' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return {
    labels: results.map(r => r._id),
    sales: results.map(r => r.sales),
    orders: results.map(r => r.orders)
  };
};

export const getSalesByChannel = async (currentDates) => {
  const match = getValidOrderMatch(currentDates.start, currentDates.end);
  
  const results = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$channel',
        sales: { $sum: '$grandTotal' },
        orders: { $sum: 1 }
      }
    }
  ]);

  const totalSales = results.reduce((acc, curr) => acc + curr.sales, 0);
  const totalOrders = results.reduce((acc, curr) => acc + curr.orders, 0);

  const channels = results.map(r => ({
    name: r._id || 'Website',
    orders: r.orders,
    sales: r.sales,
    percentage: totalSales > 0 ? Number(((r.sales / totalSales) * 100).toFixed(1)) : 0
  })).sort((a, b) => b.sales - a.sales);

  return {
    channels,
    totalSales,
    totalOrders
  };
};

export const getRevenueBreakdown = async (currentDates) => {
  // Need to include returned/refunded for accurate revenue breakdown depending on rules, 
  // but typically we match all orders and separate them out.
  const match = { createdAt: { $gte: currentDates.start, $lte: currentDates.end } };

  const results = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        grossSales: { $sum: '$subtotal' }, // Assuming subtotal is sum of items
        discounts: { $sum: { $add: ['$productDiscount', '$couponDiscount'] } },
        shippingRevenue: { $sum: '$shippingFee' },
        refunds: {
          $sum: {
            $cond: [{ $in: ['$orderStatus', ['Cancelled', 'Returned']] }, '$grandTotal', 0]
          }
        },
        netRevenueValid: {
          $sum: {
            $cond: [{ $not: { $in: ['$orderStatus', ['Cancelled', 'Returned']] } }, '$grandTotal', 0]
          }
        }
      }
    }
  ]);

  const data = results[0] || { grossSales: 0, discounts: 0, shippingRevenue: 0, refunds: 0, netRevenueValid: 0 };
  
  // Custom formula from prompt: Net Revenue = Gross Sales - Discounts - Refunds + Shipping Revenue
  const netRevenue = data.grossSales - data.discounts - data.refunds + data.shippingRevenue;

  return {
    grossSales: data.grossSales,
    discounts: data.discounts,
    refunds: data.refunds,
    shippingRevenue: data.shippingRevenue,
    netRevenue: netRevenue
  };
};

export const getProfitMargin = async (currentDates) => {
  const match = getValidOrderMatch(currentDates.start, currentDates.end);

  const results = await Order.aggregate([
    { $match: match },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'productDoc'
      }
    },
    { $unwind: { path: '$productDoc', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$_id',
        netRevenue: { $first: '$grandTotal' },
        orderCost: { 
          $sum: { 
            $multiply: [
              '$items.quantity', 
              { $ifNull: ['$productDoc.costPrice', { $multiply: ['$items.originalPrice', 0.6] }] } // fallback to 60% if no cost
            ] 
          } 
        }
      }
    },
    {
      $group: {
        _id: null,
        netRevenue: { $sum: '$netRevenue' },
        totalCostOfGoods: { $sum: '$orderCost' }
      }
    }
  ]);

  const data = results[0] || { netRevenue: 0, totalCostOfGoods: 0 };
  const grossProfit = data.netRevenue - data.totalCostOfGoods;
  const profitMargin = data.netRevenue > 0 ? Number(((grossProfit / data.netRevenue) * 100).toFixed(1)) : 0;

  return {
    totalCostOfGoods: data.totalCostOfGoods,
    grossProfit,
    profitMargin
  };
};

export const getReturnsRefunds = async (currentDates) => {
  const match = { createdAt: { $gte: currentDates.start, $lte: currentDates.end } };

  const results = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        returnedOrders: {
          $sum: {
            $cond: [{ $in: ['$orderStatus', ['Returned']] }, 1, 0]
          }
        },
        refunds: {
          $sum: {
            $cond: [{ $in: ['$orderStatus', ['Cancelled', 'Returned']] }, '$grandTotal', 0]
          }
        }
      }
    }
  ]);

  const data = results[0] || { totalOrders: 0, returnedOrders: 0, refunds: 0 };
  const returnRate = data.totalOrders > 0 ? Number(((data.returnedOrders / data.totalOrders) * 100).toFixed(1)) : 0;

  return {
    returnedOrders: data.returnedOrders,
    refunds: data.refunds,
    returnRate
  };
};

export const getCouponPerformance = async (currentDates) => {
  const match = getValidOrderMatch(currentDates.start, currentDates.end);
  match.couponDiscount = { $gt: 0 };

  const results = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        couponsUsed: { $sum: 1 }, // Assuming 1 coupon per order
        totalDiscountGiven: { $sum: '$couponDiscount' },
        couponOrders: { $sum: 1 }
      }
    }
  ]);

  const mostUsed = await Order.aggregate([
    { $match: match },
    { $group: { _id: { $ifNull: ['$couponCode', 'UNKNOWN'] }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 }
  ]);

  const data = results[0] || { couponsUsed: 0, totalDiscountGiven: 0, couponOrders: 0 };
  const mostUsedData = mostUsed[0] || { _id: 'None', count: 0 };

  return {
    couponsUsed: data.couponsUsed,
    totalDiscountGiven: data.totalDiscountGiven,
    mostUsedCoupon: {
      code: mostUsedData._id,
      usageCount: mostUsedData.count
    },
    couponOrders: data.couponOrders
  };
};

export const getPaymentMethods = async (currentDates) => {
  const match = getValidOrderMatch(currentDates.start, currentDates.end);

  const results = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$paymentMethod.type',
        orders: { $sum: 1 },
        revenue: { $sum: '$grandTotal' }
      }
    }
  ]);

  const totalOrders = results.reduce((acc, curr) => acc + curr.orders, 0);
  const totalRevenue = results.reduce((acc, curr) => acc + curr.revenue, 0);

  const methods = results.map(r => ({
    method: r._id,
    orders: r.orders,
    revenue: r.revenue
  })).sort((a, b) => b.revenue - a.revenue);

  return {
    methods,
    total: {
      orders: totalOrders,
      revenue: totalRevenue
    }
  };
};

export const getLowStockOverview = async () => {
  const LOW_STOCK_THRESHOLD = parseInt(process.env.LOW_STOCK_THRESHOLD || '10', 10);

  const results = await Product.aggregate([
    {
      $group: {
        _id: null,
        outOfStockProducts: {
          $sum: { $cond: [{ $lte: ['$countInStock', 0] }, 1, 0] }
        },
        lowStockProducts: {
          $sum: { $cond: [{ $and: [{ $gt: ['$countInStock', 0] }, { $lte: ['$countInStock', LOW_STOCK_THRESHOLD] }] }, 1, 0] }
        },
        inStockProducts: {
          $sum: { $cond: [{ $gt: ['$countInStock', LOW_STOCK_THRESHOLD] }, 1, 0] }
        }
      }
    }
  ]);

  const data = results[0] || { outOfStockProducts: 0, lowStockProducts: 0, inStockProducts: 0 };

  return {
    lowStockProducts: data.lowStockProducts,
    outOfStockProducts: data.outOfStockProducts,
    inStockProducts: data.inStockProducts
  };
};



export const getCustomerOverview = async (currentDates, previousDates) => {
  const totalCustomers = await User.countDocuments({ role: { $in: ['user', 'customer'] }, createdAt: { $lte: currentDates.end } });
  const newCustomers = await User.countDocuments({ role: { $in: ['user', 'customer'] }, createdAt: { $gte: currentDates.start, $lte: currentDates.end } });
  const returningCustomers = totalCustomers - newCustomers;

  const prevTotalCustomers = await User.countDocuments({ role: { $in: ['user', 'customer'] }, createdAt: { $lte: previousDates.end } });
  const prevNewCustomers = await User.countDocuments({ role: { $in: ['user', 'customer'] }, createdAt: { $gte: previousDates.start, $lte: previousDates.end } });
  const prevReturningCustomers = prevTotalCustomers - prevNewCustomers;

  const calcGrowth = (curr, prev) => prev === 0 ? (curr > 0 ? 100 : 0) : Number((((curr - prev) / prev) * 100).toFixed(1));

  return {
    newCustomers,
    returningCustomers: returningCustomers > 0 ? returningCustomers : 0,
    totalCustomers,
    newCustomersGrowth: calcGrowth(newCustomers, prevNewCustomers),
    returningCustomersGrowth: calcGrowth(returningCustomers > 0 ? returningCustomers : 0, prevReturningCustomers > 0 ? prevReturningCustomers : 0),
    totalCustomersGrowth: calcGrowth(totalCustomers, prevTotalCustomers)
  };
};



export const getOrderStatusOverview = async (currentDates) => {
  const match = { createdAt: { $gte: currentDates.start, $lte: currentDates.end } };

  const results = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$orderStatus',
        orders: { $sum: 1 }
      }
    }
  ]);

  const totalOrders = results.reduce((acc, curr) => acc + curr.orders, 0);

  const statuses = results.map(r => ({
    status: r._id,
    orders: r.orders,
    percentage: totalOrders > 0 ? Number(((r.orders / totalOrders) * 100).toFixed(1)) : 0
  })).sort((a, b) => b.orders - a.orders);

  const getRate = (statusName) => {
    const s = statuses.find(x => x.status === statusName);
    return s ? s.percentage : 0;
  };

  return {
    statuses,
    totalOrders,
    deliveredRate: getRate('Delivered'),
    cancellationRate: getRate('Cancelled'),
    returnRate: getRate('Returned')
  };
};

export const getCompleteReport = async (currentDates, previousDates, period) => {
  const [
    summary,
    salesOverview,
    salesByChannel,
    revenueBreakdown,
    profitMargin,
    returnsRefunds,
    couponPerformance,
    paymentMethods,
    lowStockOverview,
    customerOverview,
    orderStatusOverview
  ] = await Promise.all([
    getSummaryReport(currentDates, previousDates),
    getSalesOverview(currentDates, period),
    getSalesByChannel(currentDates),
    getRevenueBreakdown(currentDates),
    getProfitMargin(currentDates),
    getReturnsRefunds(currentDates),
    getCouponPerformance(currentDates),
    getPaymentMethods(currentDates),
    getLowStockOverview(),
    getCustomerOverview(currentDates, previousDates),
    getOrderStatusOverview(currentDates)
  ]);

  return {
    filters: {
      startDate: currentDates.start,
      endDate: currentDates.end,
      period
    },
    summary,
    salesOverview,
    salesByChannel,
    revenueBreakdown,
    profitMargin,
    returnsRefunds,
    couponPerformance,
    paymentMethods,
    lowStockOverview,
    customerOverview,
    orderStatusOverview,
    lastUpdated: new Date()
  };
};



