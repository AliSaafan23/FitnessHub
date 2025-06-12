const mongoose = require("mongoose");

const subscriptionNotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subscription",
    required: true,
  },
  type: {
    type: String,
    enum: [
      "subscription_created",
      "subscription_expiring",
      "subscription_renewed",
      "subscription_expired", // Add "subscription_expired" to the enum
    ],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("SubscriptionNotification", subscriptionNotificationSchema);
