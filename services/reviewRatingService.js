import Review from '../models/Review.js';
import Product from '../models/Product.js';

/**
 * Recalculate average rating and number of reviews for a product
 * @param {ObjectId} productId
 */
export const updateProductRating = async (productId) => {
  try {
    const stats = await Review.aggregate([
      {
        $match: {
          product: productId,
          status: 'approved', // Only count approved reviews
        },
      },
      {
        $group: {
          _id: '$product',
          averageRating: { $avg: '$rating' },
          numReviews: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      await Product.findByIdAndUpdate(productId, {
        rating: Math.round(stats[0].averageRating * 10) / 10,
        numReviews: stats[0].numReviews,
      });
    } else {
      await Product.findByIdAndUpdate(productId, {
        rating: 0,
        numReviews: 0,
      });
    }
  } catch (error) {
    console.error('Error updating product rating:', error);
  }
};

/**
 * Get detailed rating breakdown for a product
 * @param {ObjectId} productId 
 */
export const getProductRatingSummary = async (productId) => {
  try {
    const reviews = await Review.find({ product: productId, status: 'approved' });
    
    const summary = {
      averageRating: 0,
      totalReviews: reviews.length,
      ratingBreakdown: {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      }
    };

    if (reviews.length > 0) {
      let sum = 0;
      reviews.forEach(review => {
        sum += review.rating;
        summary.ratingBreakdown[review.rating] = (summary.ratingBreakdown[review.rating] || 0) + 1;
      });
      summary.averageRating = Math.round((sum / reviews.length) * 10) / 10;
    }

    return summary;
  } catch (error) {
    console.error('Error calculating rating summary:', error);
    throw error;
  }
};
