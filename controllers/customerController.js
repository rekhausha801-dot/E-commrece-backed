import Customer from '../models/customerModel.js';
import Order from '../models/orderModel.js';

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private/Admin
export const getCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { search, status } = req.query;

    let query = {};

    if (status) query.status = status;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Customer.countDocuments(query);

    res.json({
      success: true,
      message: 'Customers fetched successfully',
      data: customers,
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

// @desc    Get dashboard statistics for customers
// @route   GET /api/customers/stats
// @access  Private/Admin
export const getCustomerStats = async (req, res) => {
  try {
    const stats = await Customer.aggregate([
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          activeCustomers: {
            $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] }
          },
          blockedCustomers: {
            $sum: { $cond: [{ $eq: ['$status', 'Blocked'] }, 1, 0] }
          }
        }
      }
    ]);

    // Calculate new customers in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newCustomers = await Customer.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    const result = stats.length > 0 ? {
      totalCustomers: stats[0].totalCustomers,
      activeCustomers: stats[0].activeCustomers,
      blockedCustomers: stats[0].blockedCustomers,
      newCustomers: newCustomers
    } : {
      totalCustomers: 0,
      activeCustomers: 0,
      blockedCustomers: 0,
      newCustomers: 0
    };

    res.json({
      success: true,
      message: 'Customer statistics fetched successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single customer by ID
// @route   GET /api/customers/:id
// @access  Private/Admin
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    let recentOrders = [];
    try {
      if (Order) {
        recentOrders = await Order.find({ 'customer.customerId': customer._id }).sort({ createdAt: -1 }).limit(5);
      }
    } catch (orderError) {
      console.error("Error fetching related orders:", orderError);
    }

    res.json({
      success: true,
      message: 'Customer fetched successfully',
      data: {
        ...customer._doc,
        recentOrders
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private/Admin
export const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, address, city, state, country, pincode, status } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Name, email, and phone are required' });
    }

    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const customer = new Customer({
      name,
      email,
      phone,
      address,
      city,
      state,
      country,
      pincode,
      status: status || 'Active'
    });

    const createdCustomer = await customer.save();

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: createdCustomer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private/Admin
export const updateCustomer = async (req, res) => {
  try {
    const { name, phone, address, city, state, country, pincode, status } = req.body;
    
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    if (name) customer.name = name;
    if (phone) customer.phone = phone;
    if (address) customer.address = address;
    if (city) customer.city = city;
    if (state) customer.state = state;
    if (country) customer.country = country;
    if (pincode) customer.pincode = pincode;
    if (status) customer.status = status;

    const updatedCustomer = await customer.save();

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: updatedCustomer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update customer status
// @route   PATCH /api/customers/:id/status
// @access  Private/Admin
export const updateCustomerStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ['Active', 'Blocked'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid customer status' });
    }

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    customer.status = status;
    const updatedCustomer = await customer.save();

    res.json({
      success: true,
      message: 'Customer status updated successfully',
      data: updatedCustomer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private/Admin
export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    await Customer.deleteOne({ _id: customer._id });
    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
