const Plan = require("../models/Plan");

// Create a new plan
exports.createPlan = async (req, res) => {
  try {
    const { title, description, duration } = req.body;
    const trainerId = req.user.id; // Assuming the trainer is authenticated

    const newPlan = new Plan({
      title,
      description,
      duration,
      trainer: trainerId,
    });

    await newPlan.save();
    res.status(201).json(newPlan);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get plans for a trainer
exports.getPlans = async (req, res) => {
  try {
    const trainerId = req.user.id; // Assuming the trainer is authenticated
    const plans = await Plan.find({ trainer: trainerId });

    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update a plan
exports.updatePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const updates = req.body;

    const updatedPlan = await Plan.findByIdAndUpdate(planId, updates, { new: true });

    if (!updatedPlan) return res.status(404).json({ message: "Plan not found" });
    res.status(200).json(updatedPlan);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
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
