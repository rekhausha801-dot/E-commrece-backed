import { performGlobalSearch } from '../services/supportSearch.service.js';

export const searchHelpCenter = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search keyword (q) is required'
      });
    }

    // Check if user is authenticated and if they are admin
    // This allows the search to work for both public visitors and logged-in users/admins
    // Depending on authMiddleware, req.user might be available
    const userId = req.user ? req.user._id : null;
    const isAdmin = req.user && req.user.role === 'admin'; // Adjust role check based on your User model

    const data = await performGlobalSearch(q, userId, isAdmin);

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error in global search:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform search',
      error: error.message
    });
  }
};
