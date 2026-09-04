import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/orderModel.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import { updateProductRating, getProductRatingSummary as getSummaryService } from '../services/reviewRatingService.js';

// @desc    Create or update review
// @route   POST /api/reviews
// @access  Private
export const submitReview = async (req, res) => {
  try {
    const { productId, rating, title, comment } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, message: 'Please provide a valid rating between 1 and 5' });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a review comment' });
    }

    let product = null;
    if (mongoose.Types.ObjectId.isValid(productId)) {
      product = await Product.findById(productId);
    }
    if (!product) {
      product = await Product.findOne({ $or: [{ sku: productId }, { _id: productId }] });
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const actualProductId = product._id;

    // Check verified purchase (Order customer.customerId and items.product)
    let isVerifiedPurchase = false;
    try {
      const orders = await Order.find({
        'customer.customerId': req.user._id,
        'items.product': actualProductId,
      });
      isVerifiedPurchase = orders.length > 0;
    } catch (orderErr) {
      console.error('Error checking verified purchase:', orderErr);
    }

    // Upload images if any
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await uploadToCloudinary(file.buffer, 'ecommerce/reviews');
          if (result && result.secure_url) {
            imageUrls.push(result.secure_url);
          }
        } catch (uploadErr) {
          console.error('Cloudinary review image upload error:', uploadErr);
        }
      }
    }

    // Check if user already reviewed this product
    let review = await Review.findOne({ product: actualProductId, user: req.user._id });

    if (review) {
      // Update existing review
      review.rating = numericRating;
      review.title = title ? title.trim() : review.title;
      review.comment = comment.trim();
      if (imageUrls.length > 0) {
        review.images = imageUrls; // Overwrite instead of append since frontend only uploads one
      }
      review.isVerifiedPurchase = isVerifiedPurchase || review.isVerifiedPurchase;
      review.status = 'approved';
      await review.save();

      await updateProductRating(actualProductId);

      return res.status(200).json({
        success: true,
        message: 'Review updated successfully!',
        data: review,
      });
    }

    // Create new review
    review = new Review({
      product: actualProductId,
      user: req.user._id,
      rating: numericRating,
      title: title ? title.trim() : '',
      comment: comment.trim(),
      images: imageUrls,
      isVerifiedPurchase,
      status: 'approved',
    });

    await review.save();

    await updateProductRating(actualProductId);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully!',
      data: review,
    });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to submit review' });
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

    let targetProductId = req.params.productId;
    if (!mongoose.Types.ObjectId.isValid(targetProductId)) {
      const prod = await Product.findOne({ sku: targetProductId });
      if (prod) targetProductId = prod._id;
    }

    const filter = {
      product: targetProductId,
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
      .populate('user', 'fullName name profileImage')
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
