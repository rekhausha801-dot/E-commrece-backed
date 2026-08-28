import Settings from '../models/Settings.js';

// @desc    Get preferences settings
// @route   GET /api/admin/settings/preferences
// @access  Private/Admin
export const getPreferences = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create({});
    }

    res.json({
      language: settings.language,
      timeZone: settings.timezone,
      dateFormat: settings.dateFormat,
      currency: settings.currency,
      defaultDashboardView: settings.dashboardView
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update preferences settings
// @route   PUT /api/admin/settings/preferences
// @access  Private/Admin
export const updatePreferences = async (req, res) => {
  try {
    const { language, timeZone, dateFormat, currency, defaultDashboardView } = req.body;
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings();
    }

    if (language) settings.language = language;
    if (timeZone) settings.timezone = timeZone;
    if (dateFormat) settings.dateFormat = dateFormat;
    if (currency) settings.currency = currency;
    if (defaultDashboardView) settings.dashboardView = defaultDashboardView;

    await settings.save();

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        language: settings.language,
        timeZone: settings.timezone,
        dateFormat: settings.dateFormat,
        currency: settings.currency,
        defaultDashboardView: settings.dashboardView
      }
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
