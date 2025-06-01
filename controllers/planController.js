const Plan = require("../models/Plan");

exports.createPlan = async (req, res) => {
  try {
    // Check if user is a trainer
    if (req.user.role !== "trainer") {
      return res.status(403).json({
        success: false,
        message: "Only trainers can create plans",
      });
    }

    const { title, description, duration, maxParticipants, startDate, endDate, price } = req.body;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
      });
    }

    if (start < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Start date must be in the future",
      });
    }

    const newPlan = new Plan({
      title,
      description,
      duration,
      maxParticipants,
      startDate: start,
      endDate: end,
      price,
      trainer: req.user.id,
    });

    await newPlan.save();

    res.status(201).json({
      success: true,
      message: "Plan created successfully",
      data: newPlan,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getPlans = async (req, res) => {
  try {
    const { trainerId } = req.params;
    const plans = await Plan.find({
      trainer: trainerId,
      endDate: { $gte: new Date() }, // Only get active plans
    }).populate("trainer", "name email");

    res.status(200).json({
      success: true,
      data: plans.map((plan) => ({
        ...plan.toJSON(),
        isFull: plan.isFull,
        availableSpots: plan.maxParticipants - plan.currentParticipants,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const updates = req.body;

    // Find plan and check ownership
    const plan = await Plan.findOne({
      _id: planId,
      trainer: req.user.id,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found or unauthorized",
      });
    }

    // Don't allow reducing maxParticipants below current participants
    if (updates.maxParticipants && updates.maxParticipants < plan.currentParticipants) {
      return res.status(400).json({
        success: false,
        message: "Cannot reduce maximum participants below current participants",
      });
    }

    const updatedPlan = await Plan.findByIdAndUpdate(planId, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Plan updated successfully",
      data: updatedPlan,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Delete a plan
exports.deletePlan = async (req, res) => {
  try {
    const { planId } = req.params;

    const deletedPlan = await Plan.findByIdAndDelete(planId);

    if (!deletedPlan) return res.status(404).json({ message: "Plan not found" });
    res.status(200).json({ message: "Plan deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
