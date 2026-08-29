import { getDashboardStats } from '../services/supportDashboard.service.js';

export const getDashboard = async (req, res) => {
  try {
    const data = await getDashboardStats();
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error in support dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};
