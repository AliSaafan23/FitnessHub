const Subscription = require("../models/Subscription");
const Plan = require("../models/Plan");
const User = require("../models/User");
const mongoose = require("mongoose");
const subscriptionNotificationService = require("../services/subscriptionNotificationService");

exports.createSubscription = async (req, res) => {
  try {
    // Verify user is a trainee
    if (req.user.role !== "trainee") {
      return res.status(403).json({
        success: false,
        message: "Only trainees can create subscriptions",
      });
    }

    const { planId } = req.params;
    const { paymentMethod, startDate, endDate } = req.body;

    // Verify plan exists and check capacity
    const plan = await Plan.findById(planId).populate("trainer");

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    // Validate startDate and endDate
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid start or end date",
      });
    }

    if (parsedEndDate <= parsedStartDate) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
      });
    }

    // Calculate subscription duration in days
    const durationInDays = Math.ceil((parsedEndDate - parsedStartDate) / (1000 * 60 * 60 * 24));

    // Check if subscription duration is at least 30 days
    if (durationInDays < 30) {
      return res.status(400).json({
        success: false,
        message: "Subscription must be for at least one month",
      });
    }

    // Check if plan is full
    if (plan.currentParticipants >= plan.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: "Plan is already full",
      });
    }

    // Check if plan has started
    if (parsedStartDate > plan.endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date cannot be after plan end date",
      });
    }

    // Check if trainee is already subscribed to this plan
    const existingSubscription = await Subscription.findOne({
      trainee: req.user.id,
      plan: planId,
      status: { $in: ["active", "pending"] },
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: "You are already subscribed to this plan",
      });
    }

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create subscription
      const subscription = new Subscription({
        trainee: req.user.id,
        trainer: plan.trainer._id,
        plan: planId,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        payment: {
          amount: plan.price,
          paymentMethod,
          paymentStatus: "pending",
        },
      });

      await subscription.save({ session });

      // Increment currentParticipants in plan
      await Plan.findByIdAndUpdate(planId, { $inc: { currentParticipants: 1 } }, { session, new: true });

      // Send subscription confirmation notification
      await subscriptionNotificationService.sendSubscriptionNotification(
        req.user.id,
        "subscription_created",
        subscription
      );

      // Commit the transaction
      await session.commitTransaction();

      res.status(201).json({
        success: true,
        message: "Subscription created successfully",
        data: subscription,
      });
    } catch (error) {
      // If anything fails, abort the transaction
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("Create Subscription Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({
      [req.user.role === "trainee" ? "trainee" : "trainer"]: req.user.id,
    })
      .populate("plan")
      .populate(req.user.role === "trainee" ? "trainer" : "trainee", "name email");

    res.status(200).json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const subscription = await Subscription.findOne({
        _id: subscriptionId,
        trainee: req.user.id,
        status: { $in: ["active", "pending"] },
      }).populate("plan");

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: "Active subscription not found",
        });
      }

      // Update subscription status
      subscription.status = "cancelled";
      subscription.autoRenew = false;
      await subscription.save({ session });

      // Decrease currentParticipants in plan
      await Plan.findByIdAndUpdate(
        subscription.plan._id,
        { $inc: { currentParticipants: -1 } },
        { session, new: true }
      );

      // Commit the transaction
      await session.commitTransaction();

      res.status(200).json({
        success: true,
        message: "Subscription cancelled successfully",
      });
    } catch (error) {
      // If anything fails, abort the transaction
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("Cancel Subscription Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.updateAutoRenewal = async (req, res) => {
  try {
    // Check if user is a trainer
    if (req.user.role !== "trainer") {
      return res.status(403).json({
        success: false,
        message: "Only trainers can update subscription renewal settings",
      });
    }

    const { subscriptionId } = req.params;
    const { autoRenew } = req.body;

    // Update query to check trainer instead of trainee
    const subscription = await Subscription.findOneAndUpdate(
      {
        _id: subscriptionId,
        trainer: req.user.id, // Changed from trainee to trainer
      },
      { autoRenew },
      { new: true }
    ).populate("trainee", "name email"); // Optionally populate trainee info

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found or you are not authorized to update it",
      });
    }

    res.status(200).json({
      success: true,
      message: "Auto-renewal settings updated",
      data: subscription,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.renewSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    // Find the subscription
    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    // Check if the subscription is expired
    if (subscription.status !== "expired") {
      return res.status(400).json({
        success: false,
        message: "Subscription is not expired",
      });
    }

    // Renew the subscription
    subscription.status = "active";
    subscription.startDate = new Date();
    subscription.endDate = new Date(new Date().setDate(new Date().getDate() + 30)); // Renew for 30 days

    // Clear the expiration notification
    subscription.notificationsSent = subscription.notificationsSent.filter(
      (notification) => notification.type !== "expiration"
    );

    await subscription.save();

    res.status(200).json({
      success: true,
      message: "Subscription renewed successfully",
      data: subscription,
    });
  } catch (error) {
    console.error("Renew Subscription Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
