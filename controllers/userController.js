import User from '../models/User.js';

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          profileImage: user.profileImage,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
        },
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.phone = req.body.phone || user.phone;
      user.dateOfBirth = req.body.dateOfBirth || user.dateOfBirth;
      user.gender = req.body.gender || user.gender;

      const updatedUser = await user.save();

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          profileImage: updatedUser.profileImage,
          dateOfBirth: updatedUser.dateOfBirth,
          gender: updatedUser.gender,
        },
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Upload profile image
// @route   POST /api/user/profile-image
// @access  Private
export const uploadProfileImage = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user && req.file) {
      // The file path relative to the public folder
      const imagePath = `/uploads/profiles/${req.file.filename}`;
      user.profileImage = imagePath;
      
      const updatedUser = await user.save();
      
      res.json({
        success: true,
        message: 'Profile image updated successfully',
        data: {
          profileImage: updatedUser.profileImage,
        },
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found or no file uploaded' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
