const Subscription = require("../models/Subscription");
const Plan = require("../models/Plan");
const User = require("../models/User");
const mongoose = require("mongoose");

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
    const { paymentMethod } = req.body;

    // Verify plan exists and check capacity
    const plan = await Plan.findById(planId).populate("trainer");

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
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
    if (new Date() > plan.endDate) {
      return res.status(400).json({
        success: false,
        message: "Plan has already ended",
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
        startDate: new Date(),
        endDate: plan.endDate,
        payment: {
          amount: plan.price,
          paymentMethod,
          paymentStatus: "pending",
        },
      });

      await subscription.save({ session });

      // Increment currentParticipants in plan
      await Plan.findByIdAndUpdate(planId, { $inc: { currentParticipants: 1 } }, { session, new: true });

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
