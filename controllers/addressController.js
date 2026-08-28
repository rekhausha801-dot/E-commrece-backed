import Address from '../models/Address.js';

// @desc    Get all addresses for logged in user
// @route   GET /api/addresses
// @access  Private
export const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
    res.json({
      success: true,
      addresses
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single address by ID
// @route   GET /api/addresses/:id
// @access  Private
export const getAddressById = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    if (address.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this address' });
    }
    res.json({
      success: true,
      address
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new address
// @route   POST /api/addresses
// @access  Private
export const createAddress = async (req, res) => {
  try {
    const {
      fullName, mobileNumber, alternateMobileNumber, addressLine1,
      addressLine2, landmark, city, state, country, pincode, addressType, isDefault
    } = req.body;

    if (!fullName || !mobileNumber || !addressLine1 || !city || !state || !country || !pincode) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Check if this is the user's first address
    const existingAddressesCount = await Address.countDocuments({ user: req.user._id });
    const isFirstAddress = existingAddressesCount === 0;
    
    const shouldBeDefault = isFirstAddress || isDefault;

    // If making default, unset other defaults
    if (shouldBeDefault && !isFirstAddress) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    }

    const address = new Address({
      user: req.user._id,
      fullName,
      mobileNumber,
      alternateMobileNumber,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      country,
      pincode,
      addressType: addressType || 'Home',
      isDefault: shouldBeDefault
    });

    const createdAddress = await address.save();
    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      address: createdAddress
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update address
// @route   PUT /api/addresses/:id
// @access  Private
export const updateAddress = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    if (address.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this address' });
    }

    // If setting to default, unset others
    if (req.body.isDefault && !address.isDefault) {
      await Address.updateMany({ user: req.user._id, _id: { $ne: address._id } }, { isDefault: false });
    }

    const allowedUpdates = [
      'fullName', 'mobileNumber', 'alternateMobileNumber', 'addressLine1',
      'addressLine2', 'landmark', 'city', 'state', 'country', 'pincode', 'addressType', 'isDefault'
    ];

    allowedUpdates.forEach(update => {
      if (req.body[update] !== undefined) {
        address[update] = req.body[update];
      }
    });

    const updatedAddress = await address.save();
    res.json({
      success: true,
      message: 'Address updated successfully',
      address: updatedAddress
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete address
// @route   DELETE /api/addresses/:id
// @access  Private
export const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    if (address.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this address' });
    }

    const wasDefault = address.isDefault;
    await Address.deleteOne({ _id: address._id });

    // If deleted default, make oldest remaining default
    if (wasDefault) {
      const oldestAddress = await Address.findOne({ user: req.user._id }).sort({ createdAt: 1 });
      if (oldestAddress) {
        oldestAddress.isDefault = true;
        await oldestAddress.save();
      }
    }

    res.json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Set address as default
// @route   PATCH /api/addresses/:id/default
// @access  Private
export const setDefaultAddress = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    if (address.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this address' });
    }

    await Address.updateMany({ user: req.user._id }, { isDefault: false });
    
    address.isDefault = true;
    const updatedAddress = await address.save();

    res.json({
      success: true,
      message: 'Default address updated successfully',
      address: updatedAddress
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
