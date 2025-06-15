const SubscriptionNotification = require("../models/SubscriptionNotification");
const Subscription = require("../models/Subscription");

exports.sendSubscriptionNotification = async (userId, type, subscription) => {
  try {
    let title, message;

    switch (type) {
      case "subscription_created":
        title = "Subscription Confirmed";
        message = `Your subscription to ${subscription.plan.title} has been successfully created.`;
        break;
      case "subscription_expiring":
        const daysLeft = Math.ceil((subscription.endDate - new Date()) / (1000 * 60 * 60 * 24));
        title = "Subscription Expiring Soon";
        message = `Your subscription to ${subscription.plan.title} will expire in ${daysLeft} days. Renew now to continue your fitness journey!`;
        break;
      case "subscription_expired":
        title = "Subscription Expired";
        message = `Your subscription to ${subscription.plan.title} has expired. Renew now to continue your fitness journey!`;
        break;
      case "subscription_renewed":
        title = "Subscription Renewed";
        message = `Your subscription to ${subscription.plan.title} has been successfully renewed.`;
        break;
      default:
        throw new Error("Invalid notification type");
    }

    const notification = new SubscriptionNotification({
      recipient: userId,
      subscription: subscription._id,
      type,
      title,
      message,
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error("Subscription Notification Error:", error);
    throw error;
  }
};

exports.checkExpiredSubscriptions = async () => {
  try {
    const subscriptions = await Subscription.find({
      status: "active",
    }).populate("plan trainee");

    console.log("subscriptions.length:", subscriptions.length);

    for (const subscription of subscriptions) {
      console.log("subscription:", subscription);
      if (subscription.hasExpired()) {
        // Check if expiration notification has already been sent
        const expirationNotificationSent = subscription.notificationsSent.some(
          (notification) => notification.type === "expiration"
        );

        if (!expirationNotificationSent) {
          await this.sendSubscriptionNotification(subscription.trainee._id, "subscription_expired", subscription);

          // Update subscription status and notificationsSent array
          subscription.status = "expired";
          subscription.notificationsSent.push({
            type: "expiration",
            sentAt: new Date(),
            message: "Expiration notification sent",
          });

          await subscription.save();
        }
      }
    }
  } catch (error) {
    console.error("Check Expired Subscriptions Error:", error);
  }
};
