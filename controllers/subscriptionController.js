const Subscription = require("../models/Subscription");
const Plan = require("../models/Plan");
const User = require("../models/User");

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

    // Verify plan exists
    const plan = await Plan.findById(planId).populate("trainer");
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + parseInt(plan.duration));

    // Create subscription
    const subscription = new Subscription({
      trainee: req.user.id,
      trainer: plan.trainer._id,
      plan: planId,
      startDate,
      endDate,
      payment: {
        amount: plan.price,
        paymentMethod,
        paymentStatus: "pending", // Will be updated after payment processing
      },
    });

    await subscription.save();

    // Here you would integrate with your payment gateway
    // For example: Stripe, PayPal, etc.
    // await processPayment(subscription);

    res.status(201).json({
      success: true,
      message: "Subscription created successfully",
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

    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      trainee: req.user.id,
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    subscription.status = "cancelled";
    subscription.autoRenew = false;
    await subscription.save();

    res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully",
    });
  } catch (error) {
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
