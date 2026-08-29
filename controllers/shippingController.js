import ShippingSetting from '../models/ShippingSetting.js';

// Helper to get or create default settings
const getOrCreateSettings = async () => {
  let settings = await ShippingSetting.findOne();
  if (!settings) {
    settings = await ShippingSetting.create({
      baseCharge: 99,
      freeShippingThreshold: 999,
      enableFreeShipping: true,
      customRoutes: []
    });
  }
  return settings;
};

// @desc    Get shipping settings
// @route   GET /api/shipping/settings
// @access  Public (or Admin if you prefer, but public might be needed if front-end needs to see it)
export const getShippingSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update shipping settings
// @route   PUT /api/shipping/settings
// @access  Private/Admin
export const updateShippingSettings = async (req, res) => {
  try {
    const { baseCharge, freeShippingThreshold, enableFreeShipping } = req.body;
    let settings = await getOrCreateSettings();

    if (baseCharge !== undefined) settings.baseCharge = baseCharge;
    if (freeShippingThreshold !== undefined) settings.freeShippingThreshold = freeShippingThreshold;
    if (enableFreeShipping !== undefined) settings.enableFreeShipping = enableFreeShipping;

    await settings.save();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add custom shipping route
// @route   POST /api/shipping/settings/routes
// @access  Private/Admin
export const addCustomRoute = async (req, res) => {
  try {
    const { originCity, destinationCity, charge } = req.body;
    
    if (!originCity || !destinationCity || charge === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide originCity, destinationCity, and charge' });
    }

    let settings = await getOrCreateSettings();

    // Check if route already exists (case-insensitive)
    const existingRouteIndex = settings.customRoutes.findIndex(
      r => r.originCity.toLowerCase() === originCity.toLowerCase() && 
           r.destinationCity.toLowerCase() === destinationCity.toLowerCase()
    );

    if (existingRouteIndex >= 0) {
      // Update existing
      settings.customRoutes[existingRouteIndex].charge = charge;
    } else {
      // Add new
      settings.customRoutes.push({ originCity, destinationCity, charge });
    }

    await settings.save();
    res.status(201).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove custom shipping route
// @route   DELETE /api/shipping/settings/routes/:routeId
// @access  Private/Admin
export const removeCustomRoute = async (req, res) => {
  try {
    let settings = await getOrCreateSettings();
    
    settings.customRoutes = settings.customRoutes.filter(
      r => r._id.toString() !== req.params.routeId
    );

    await settings.save();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
