const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
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
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plan",
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "expired", "cancelled", "pending"],
    default: "pending",
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  payment: {
    amount: {
      type: Number,
    },
    currency: {
      type: String,
      default: "USD",
    },
    transactionId: String,
    paymentMethod: {
      type: String,
      enum: ["credit_card", "paypal", "bank_transfer", "crypto"],
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
  },
  autoRenew: {
    type: Boolean,
    default: false,
  },
  notificationsSent: [
    {
      type: {
        type: String,
        enum: ["renewal", "expiration", "payment"],
      },
      sentAt: Date,
      message: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries
subscriptionSchema.index({ trainee: 1, status: 1 });
subscriptionSchema.index({ trainer: 1, status: 1 });
subscriptionSchema.index({ endDate: 1, status: 1 }); // For expiration checks

module.exports = mongoose.model("Subscription", subscriptionSchema);
