import Review from '../models/Review.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';
import { updateProductRating } from '../services/reviewRatingService.js';

// @desc    Get all reviews (Admin)
// @route   GET /api/admin/reviews
// @access  Private/Admin
export const getAllReviews = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.rating) {
      filter.rating = Number(req.query.rating);
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { title: searchRegex },
        { comment: searchRegex },
      ];
    }

    const reviews = await Review.find(filter)
      .populate('product', 'name images sku')
      .populate('user', 'fullName name email profileImage')
      .sort({ createdAt: -1 })
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
    console.error('Get all reviews error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single review by ID (Admin)
// @route   GET /api/admin/reviews/:id
// @access  Private/Admin
export const getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('product', 'name images sku')
      .populate('user', 'fullName name email profileImage');

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    res.json({ success: true, data: review });
  } catch (error) {
    console.error('Get review by id error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update review status (Admin)
// @route   PATCH /api/admin/reviews/:id/status
// @access  Private/Admin
export const updateReviewStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'approved', 'rejected', 'hidden'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    review.status = status;
    await review.save();

    // Recalculate product rating since visibility changed
    await updateProductRating(review.product);

    res.json({
      success: true,
      message: `Review status updated to ${status}`,
      data: review,
    });
  } catch (error) {
    console.error('Update review status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a review (Admin)
// @route   DELETE /api/admin/reviews/:id
// @access  Private/Admin
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Delete images from Cloudinary
    if (review.images && review.images.length > 0) {
      for (const imageUrl of review.images) {
        // Extract public ID from cloudinary URL
        // Format: https://res.cloudinary.com/.../image/upload/v12345/reviews/filename.jpg
        try {
          const parts = imageUrl.split('/');
          const filename = parts[parts.length - 1];
          const folder = parts[parts.length - 2];
          const publicId = `${folder}/${filename.split('.')[0]}`;
          await deleteFromCloudinary(publicId);
        } catch (err) {
          console.error('Failed to extract public ID or delete image:', err);
        }
      }
    }

    const productId = review.product;
    await Review.findByIdAndDelete(req.params.id);

    // Recalculate product rating since review is deleted
    await updateProductRating(productId);

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Reply to a review (Admin)
// @route   POST /api/admin/reviews/:id/reply
// @access  Private/Admin
export const replyToReview = async (req, res) => {
  try {
    const { adminReply } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    review.adminReply = adminReply;
    await review.save();

    res.json({
      success: true,
      message: 'Admin reply added successfully',
      data: review,
    });
  } catch (error) {
    console.error('Admin reply error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
