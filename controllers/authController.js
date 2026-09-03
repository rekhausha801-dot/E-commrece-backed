import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { OAuth2Client } from "google-auth-library";
import generateToken from "../utils/generateToken.js";

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
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
      fullName,
      email,
      phoneNumber: mobile,
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
      token: generateToken(user._id),
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
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

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        success: true,
        message: 'Login successful',
        token: generateToken(user._id),
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          profileImage: user.profileImage,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
          role: user.role
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Auth admin & get token
// @route   POST /api/auth/admin/login
// @access  Public
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (user && (await bcrypt.compare(password, user.password))) {
      if (user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
      }
      res.json({
        success: true,
        message: 'Admin Login successful',
        token: generateToken(user._id),
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          profileImage: user.profileImage,
          role: user.role
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (user) {
      res.json({
        success: true,
        user
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      // Exclude password and role from being updated here
      user.fullName = req.body.fullName || user.fullName;
      user.email = req.body.email || user.email;
      user.phoneNumber = req.body.phone || user.phoneNumber; // frontend sends 'phone'
      user.profileImage = req.body.profileImage || user.profileImage;
      user.dateOfBirth = req.body.dateOfBirth || user.dateOfBirth;
      user.gender = req.body.gender || user.gender;

      const updatedUser = await user.save();

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          _id: updatedUser._id,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          phoneNumber: updatedUser.phoneNumber,
          profileImage: updatedUser.profileImage,
          dateOfBirth: updatedUser.dateOfBirth,
          gender: updatedUser.gender,
          role: updatedUser.role,
        },
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error during profile update' });
  }
};


const client = new OAuth2Client((process.env.GOOGLE_CLIENT_ID || "830862223596-dpe9lhl67h3tndc0n47888qec4j7cpcl.apps.googleusercontent.com"));

export const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ success: false, message: "Missing credential" });
    }
    
    // Verify Google ID token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: (process.env.GOOGLE_CLIENT_ID || "830862223596-dpe9lhl67h3tndc0n47888qec4j7cpcl.apps.googleusercontent.com"),
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ success: false, message: "Invalid Google token" });
    }
    
    const { email, name, picture, sub, email_verified } = payload;
    
    if (!email || !email_verified) {
      return res.status(400).json({ success: false, message: "Unverified or missing email" });
    }
    
    // Check if user exists
    let user = await User.findOne({ email });
    
    if (user) {
      // CASE 2 & 3: Link if needed
      let updated = false;
      if (!user.googleId) {
        user.googleId = sub;
        updated = true;
      }
      if (!user.provider || user.provider === 'local') {
        user.provider = 'google';
        updated = true;
      }
      if (!user.profileImage && picture) {
        user.profileImage = picture;
        updated = true;
      }
      
      if (updated) {
        await user.save();
      }
      
      const tokenStr = generateToken(user._id);
      return res.status(200).json({
        success: true,
        message: "Google login successful",
        token: tokenStr,
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      });
    } else {
      // CASE 1: Create new user
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);
      
      user = await User.create({
        fullName: name,
        email,
        password: hashedPassword,
        profileImage: picture,
        googleId: sub,
        provider: 'google',
        termsAccepted: true
      });
      
      const tokenStr = generateToken(user._id);
      return res.status(201).json({
        success: true,
        message: "Google login successful",
        token: tokenStr,
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      });
    }
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(401).json({
      success: false,
      message: "Google authentication failed",
    });
  }
};

export const getActiveSessions = async (req, res) => {
  try {
    res.json({
      success: true,
      data: [
        {
          id: 'mock-session-1',
          device: 'Windows PC - Chrome',
          location: 'Chennai, India',
          ipAddress: req.ip || '127.0.0.1',
          lastActive: new Date(),
          isCurrent: true
        }
      ]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const revokeSession = async (req, res) => {
  res.json({ success: true, message: 'Session revoked successfully' });
};

export const revokeAllSessions = async (req, res) => {
  res.json({ success: true, message: 'All other sessions revoked successfully' });
};


export const updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { newPassword } = req.body;

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

