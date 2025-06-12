const Notification = require("../models/Notification");
const User = require("../models/User");

exports.createNotification = async (type, title, message, relatedId) => {
  try {
    // Get all users
    const users = await User.find({}, "_id");

    // Create notifications for all users
    const notifications = users.map((user) => ({
      recipient: user._id,
      type,
      title,
      message,
      relatedId,
    }));

    await Notification.insertMany(notifications);

    // Here you could also implement real-time notifications using WebSocket
    // or integrate with a push notification service
  } catch (error) {
    console.error("Notification Creation Error:", error);
    throw error;
  }
};
