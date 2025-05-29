const Review = require("../models/Review");
const User = require("../models/User");

exports.createReview = async (req, res) => {
  try {
    // Check if user is a trainee
    if (req.user.role !== "trainee") {
      return res.status(403).json({
        success: false,
        message: "Only trainees can submit reviews",
      });
    }
    const { trainerId } = req.params;
    const { rating, review } = req.body;

    // Verify trainer exists and is actually a trainer
    const trainer = await User.findOne({ _id: trainerId, role: "trainer" });
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: "Trainer not found",
      });
    }

    // Create the review
    const newReview = new Review({
      trainee: req.user.id,
      trainer: trainerId,
      rating,
      review,
    });

    await newReview.save();

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: newReview,
    });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this trainer",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getTrainerReviews = async (req, res) => {
  try {
    const { trainerId } = req.params;

    const reviews = await Review.find({ trainer: trainerId })
      .populate("trainee", "name profilePic")
      .sort({ createdAt: -1 });

    // Calculate average rating
    const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;

    res.status(200).json({
      success: true,
      data: {
        reviews,
        averageRating: averageRating || 0,
        totalReviews: reviews.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, review } = req.body;

    const updatedReview = await Review.findOneAndUpdate(
      { _id: reviewId, trainee: req.user.id },
      { rating, review },
      { new: true, runValidators: true }
    );

    if (!updatedReview) {
      return res.status(404).json({
        success: false,
        message: "Review not found or you're not authorized to update it",
      });
    }

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      data: updatedReview,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findOneAndDelete({
      _id: reviewId,
      trainee: req.user.id,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or you're not authorized to delete it",
      });
    }

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
