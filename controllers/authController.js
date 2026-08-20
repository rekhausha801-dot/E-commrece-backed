import bcrypt from "bcryptjs";
import User from "../models/User.js";

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
