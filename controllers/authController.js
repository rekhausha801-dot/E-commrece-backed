import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Customer from "../models/customerModel.js";

export const registerUser = async (req, res) => {
  try {
    const { fullName, email, mobile, password, confirmPassword, termsAccepted } =
      req.body;

 
    if (!fullName || !email || !mobile || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    
    if (!termsAccepted) {
      return res.status(400).json({
        success: false,
        message: "Please accept Terms and Conditions",
      });
    }

    
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

   
        const user = await User.create({
      name: fullName,
      email,
      phone: mobile,
      password: hashedPassword,
      termsAccepted,
    });

    try {
      await Customer.create({
        name: fullName,
        email,
        phone: mobile,
        status: "Active"
      });
    } catch (customerError) {
      console.error("Failed to sync customer profile during registration:", customerError);
    }

   
    res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
        message: 'Login successfully'
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        message: 'Profile retrieved'
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

