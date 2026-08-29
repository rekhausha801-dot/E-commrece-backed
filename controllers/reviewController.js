import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/orderModel.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import { getProductRatingSummary as getSummaryService } from '../services/reviewRatingService.js';

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private
export const submitReview = async (req, res) => {
  try {
    const { productId, rating, title, comment } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check verified purchase
    const orders = await Order.find({ user: req.user._id, 'orderItems.product': productId });
    const isVerifiedPurchase = orders.length > 0;

    // Upload images if any
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, 'reviews');
        imageUrls.push(result.secure_url);
      }
    }

    const review = new Review({
      product: productId,
      user: req.user._id,
      rating: Number(rating),
      title,
      comment,
      images: imageUrls,
      isVerifiedPurchase,
      status: 'pending', // Requires admin approval
    });

    await review.save();

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully and is pending approval.',
      data: review,
    });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get approved reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
export const getProductReviews = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {
      product: req.params.productId,
      status: 'approved',
    };

    if (req.query.rating) {
      filter.rating = Number(req.query.rating);
    }

    let sortOption = { createdAt: -1 };
    if (req.query.sort === 'oldest') sortOption = { createdAt: 1 };
    else if (req.query.sort === 'highest') sortOption = { rating: -1 };
    else if (req.query.sort === 'lowest') sortOption = { rating: 1 };

    const reviews = await Review.find(filter)
      .populate('user', 'name profileImage')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const totalReviews = await Review.countDocuments(filter);

    res.json({
      success: true,
      data: reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews,
        limit,
      },
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get product rating summary
// @route   GET /api/reviews/product/:productId/summary
// @access  Public
export const getProductRatingSummary = async (req, res) => {
  try {
    const summary = await getSummaryService(req.params.productId);
    res.json({
      success: true,
      productId: req.params.productId,
      ...summary,
    });
  } catch (error) {
    console.error('Get rating summary error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Mark a review as helpful
// @route   PUT /api/reviews/:id/helpful
// @access  Public
export const markReviewHelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    review.helpfulCount = (review.helpfulCount || 0) + 1;
    await review.save();

    res.json({
      success: true,
      message: 'Review marked as helpful',
      helpfulCount: review.helpfulCount,
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a review (Customer)
// @route   DELETE /api/reviews/:id
// @access  Private
export const deleteCustomerReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Ensure the user owns the review
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
    }

    await review.deleteOne();
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
