const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  trainee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  review: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 500,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent duplicate reviews from same trainee for same trainer
reviewSchema.index({ trainee: 1, trainer: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
