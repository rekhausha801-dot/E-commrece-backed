
import User from '../models/User.js';
import Order from '../models/orderModel.js';
import mongoose from 'mongoose';

export const getCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { search } = req.query;
    let matchQuery = { role: { $in: ['user', 'customer'] } };

    if (search) {
      matchQuery.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const customersPipeline = [
      { $match: matchQuery },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'user',
          as: 'ordersList'
        }
      },
      {
        $addFields: {
          ordersCount: { $size: '$ordersList' },
          totalSpent: {
            $sum: '$ordersList.grandTotal'
          }
        }
      },
      {
        $project: {
          ordersList: 0,
          password: 0
        }
      }
    ];

    const customers = await User.aggregate(customersPipeline);
    const total = await User.countDocuments(matchQuery);

    res.json({
      success: true,
      message: 'Customers fetched successfully',
      data: customers.map(c => ({
        _id: c._id,
        name: c.fullName,
        email: c.email,
        phone: c.phoneNumber,
        totalOrders: c.ordersCount,
        totalSpent: c.totalSpent,
        createdAt: c.createdAt,
        status: 'Active',
        profileImage: c.profileImage
      })),
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

export const getCustomerStats = async (req, res) => {
  try {
    const matchQuery = { role: { $in: ['user', 'customer'] } };
    const totalCustomers = await User.countDocuments(matchQuery);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newCustomers = await User.countDocuments({ ...matchQuery, createdAt: { $gte: sevenDaysAgo } });

    res.json({
      success: true,
      message: 'Customer statistics fetched successfully',
      data: {
        totalCustomers,
        activeCustomers: totalCustomers,
        blockedCustomers: 0,
        newCustomers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCustomerById = async (req, res) => { res.status(200).json({ success: true }); };
export const createCustomer = async (req, res) => { res.status(200).json({ success: true }); };
export const updateCustomer = async (req, res) => { res.status(200).json({ success: true }); };
export const updateCustomerStatus = async (req, res) => { res.status(200).json({ success: true }); };
export const deleteCustomer = async (req, res) => { res.status(200).json({ success: true }); };

export const sendMessageToCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message, type } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    const { createCustomerNotification } = await import('./customerNotification.controller.js');
    await createCustomerNotification({
      user: id,
      type: type || 'Info',
      title,
      message,
      link: '/customer/dashboard'
    });

    res.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
