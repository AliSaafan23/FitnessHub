const mongoose = require("mongoose");

const planSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: String, required: true },
  trainer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  maxParticipants: {
    type: Number,
    required: true,
    min: 1,
  },
  currentParticipants: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: "USD",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add virtual field to check if plan is full
planSchema.virtual("isFull").get(function () {
  return this.currentParticipants >= this.maxParticipants;
});

// Add validation for dates
planSchema.pre("save", function (next) {
  if (this.startDate >= this.endDate) {
    next(new Error("End date must be after start date"));
  }
  if (this.startDate < new Date()) {
    next(new Error("Start date must be in the future"));
  }
  next();
});

// Add after existing virtuals
planSchema.methods.hasAvailableSpots = function () {
  return this.currentParticipants < this.maxParticipants;
};

planSchema.methods.getAvailableSpots = function () {
  return this.maxParticipants - this.currentParticipants;
};

module.exports = mongoose.model("Plan", planSchema);
