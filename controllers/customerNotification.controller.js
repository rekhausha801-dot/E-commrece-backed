import CustomerNotification from '../models/CustomerNotification.model.js';

export const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    // Get user-specific notifications AND broadcast notifications
    const notifications = await CustomerNotification.find({
      $or: [
        { user: userId },
        { user: 'all' }
      ]
    }).sort({ createdAt: -1 }).limit(50);

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching customer notifications:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await CustomerNotification.findById(id);
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    // Note: for broadcast notifications, marking as read for a specific user would require a readBy array, 
    // but for simplicity we'll just ignore marking broadcast as read, or allow it to be marked read for everyone if they are 'all'
    if (notification.user !== 'all') {
      notification.isRead = true;
      await notification.save();
    }
    
    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    await CustomerNotification.updateMany(
      { user: userId, isRead: false },
      { $set: { isRead: true } }
    );
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Internal utility function
export const createCustomerNotification = async ({ user, type, title, message, link }) => {
  try {
    const newNotification = new CustomerNotification({
      user, type, title, message, link
    });
    await newNotification.save();
    return newNotification;
  } catch (error) {
    console.error('Error creating customer notification:', error);
  }
};