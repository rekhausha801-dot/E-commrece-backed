import Settings from '../models/Settings.js';

// @desc    Get global settings
// @route   GET /api/settings
// @access  Private/Admin
export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    // Create default settings if it doesn't exist
    if (!settings) {
      settings = await Settings.create({});
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update global settings
// @route   PUT /api/settings
// @access  Private/Admin
export const updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings(req.body);
      await settings.save();
    } else {
      // Update fields
      const updatedFields = req.body;
      for (const key in updatedFields) {
        settings[key] = updatedFields[key];
      }
      await settings.save();
    }

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
