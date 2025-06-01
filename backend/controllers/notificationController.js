import Notification from '../models/Notification.js';
import { io, activeUsers } from '../server.js'; 

export const createNotification = async (userId, type, message, projectId = null, relatedUserId = null, collaborationId = null) => {
  try {
    const notification = new Notification({
      user: userId,
      type,
      message,
      projectId,
      relatedUser,
      collaborationId // Ensure this is passed if relevant for requests/invites
    });
    await notification.save();

    // Populate necessary fields for the frontend to consume immediately
    const populatedNotification = await Notification.findById(notification._id)
        .populate('projectId', 'title _id') // For NEW_MESSAGE, project title is useful
        .populate('relatedUser', 'name avatar _id'); // For sender info

    // Emit to the specific user if they are online
    let targetSocketId = null;
    for (const [socketId, uid] of activeUsers.entries()) {
        if (uid.toString() === userId.toString()) {
            targetSocketId = socketId;
            break;
        }
    }

    if (targetSocketId) {
        io.to(targetSocketId).emit('newNotification', populatedNotification); // Send populated notification
        //
        // 
        // console.log(`Notification (type: ${type}) sent to user ${userId} via socket ${targetSocketId}`);
    } else {
        //console.log(`User ${userId} not active, notification (type: ${type}) saved to DB.`);
    }
    
    return populatedNotification; // Return the populated notification
  } catch (error) {
    //console.error('Error creating notification:', error);
    // throw error; // Optionally re-throw if the caller needs to handle it
  }
};

// ... rest of getNotifications, markNotificationsAsRead, handleSocketConnection
// (handleSocketConnection is mostly a placeholder in this setup, primary logic is in createNotification)

// @desc    Get notifications for logged-in user
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ date: -1 })
      .populate('projectId', 'title _id')
      .populate('relatedUser', 'name avatar _id');
    res.json(notifications);
  } catch (err) {
    //console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Mark notification(s) as read
// @route   PUT /api/notifications/read
// @access  Private
export const markNotificationsAsRead = async (req, res) => {
  const { notificationIds } = req.body; 
  try {
    let query = { user: req.user.id };
    if (notificationIds && notificationIds.length > 0) {
        query._id = { $in: notificationIds };
    } else {
        query.isRead = false; // Mark all unread if no IDs provided
    }

    const result = await Notification.updateMany(
      query,
      { $set: { isRead: true } }
    );
    
    if (result.matchedCount === 0 && notificationIds && notificationIds.length > 0) {
        return res.status(404).json({ message: 'No matching notifications found for this user to mark as read.' });
    }

    res.json({ message: 'Notifications marked as read', modifiedCount: result.modifiedCount, acknowledged: true });
  } catch (err) {
    //console.error(err.message);
    res.status(500).send('Server error');
  }
};

export const handleSocketConnection = (ioInstance, socket) => {
    // console.log(`Handling specific socket events for ${socket.id}`);
};
