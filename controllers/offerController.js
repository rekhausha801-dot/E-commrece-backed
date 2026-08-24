import Offer from '../models/offerModel.js';

// @desc    Get all active and valid offers (Customer facing)
// @route   GET /api/offers
// @access  Public
export const getOffers = async (req, res) => {
  try {
    const { category } = req.query;
    const currentDate = new Date();

    let query = {};
    if (req.query.admin !== 'true') {
      query = {
        isActive: true,
        startDate: { $lte: currentDate },
        endDate: { $gte: currentDate }
      };
    }

    if (category && category !== 'All Offers') {
      query.category = category;
    }

    const offers = await Offer.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: offers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single offer by ID (Admin)
// @route   GET /api/offers/:id
// @access  Private/Admin
export const getOfferById = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    res.json({
      success: true,
      data: offer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new offer (Admin)
// @route   POST /api/offers
// @access  Private/Admin
export const createOffer = async (req, res) => {
  try {
    const {
      title, category, badge, description, discountType,
      discountValue, minPurchase, couponCode, image,
      startDate, endDate, isActive, isFirstOrderOnly
    } = req.body;

    // Check for duplicate coupon code
    const existingOffer = await Offer.findOne({ couponCode });
    if (existingOffer) {
      return res.status(409).json({ success: false, message: 'Coupon code already exists' });
    }

    const offer = new Offer({
      title, category, badge, description, discountType,
      discountValue, minPurchase, couponCode, image,
      startDate, endDate, isActive, isFirstOrderOnly
    });

    const createdOffer = await offer.save();

    res.status(201).json({
      success: true,
      message: 'Offer created successfully',
      data: createdOffer
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update offer (Admin)
// @route   PUT /api/offers/:id
// @access  Private/Admin
export const updateOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    const {
      title, category, badge, description, discountType,
      discountValue, minPurchase, couponCode, image,
      startDate, endDate, isActive, isFirstOrderOnly
    } = req.body;

    // If coupon code is being changed, check for duplicates
    if (couponCode && couponCode !== offer.couponCode) {
      const existingOffer = await Offer.findOne({ couponCode });
      if (existingOffer) {
        return res.status(409).json({ success: false, message: 'Coupon code already exists' });
      }
    }

    if (title) offer.title = title;
    if (category) offer.category = category;
    if (badge !== undefined) offer.badge = badge;
    if (description !== undefined) offer.description = description;
    if (discountType) offer.discountType = discountType;
    if (discountValue !== undefined) offer.discountValue = discountValue;
    if (minPurchase !== undefined) offer.minPurchase = minPurchase;
    if (couponCode) offer.couponCode = couponCode;
    if (image !== undefined) offer.image = image;
    if (startDate) offer.startDate = startDate;
    if (endDate) offer.endDate = endDate;
    if (isActive !== undefined) offer.isActive = isActive;
    if (isFirstOrderOnly !== undefined) offer.isFirstOrderOnly = isFirstOrderOnly;

    const updatedOffer = await offer.save();

    res.json({
      success: true,
      message: 'Offer updated successfully',
      data: updatedOffer
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete offer (Admin)
// @route   DELETE /api/offers/:id
// @access  Private/Admin
export const deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    await Offer.deleteOne({ _id: offer._id });
    
    res.json({
      success: true,
      message: 'Offer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
