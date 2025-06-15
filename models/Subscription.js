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
  notificationPreferences: {
    type: {
      subscriptionStart: { type: Boolean, default: true },
      subscriptionEnd: { type: Boolean, default: true },
    },
    default: { subscriptionStart: true, subscriptionEnd: true },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries
subscriptionSchema.index({ trainee: 1, status: 1 });
subscriptionSchema.index({ trainer: 1, status: 1 });
subscriptionSchema.index({ endDate: 1, status: 1 }); // For expiration checks

// Add a method to check if subscription is near expiration
subscriptionSchema.methods.isNearExpiration = function () {
  const now = new Date();
  const oneMinuteFromNow = new Date(now.getTime() + 1 * 60 * 1000); // 1 minute for testing
  return this.endDate <= oneMinuteFromNow && this.endDate > now;
};

subscriptionSchema.methods.hasExpired = function () {
  const now = new Date();

  // نحسب تاريخ بكرا بنفس توقيت اليوم
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  // نطبع عشان نتاكد
  console.log("endDate:", this.endDate);
  console.log("tomorrow:", tomorrow);

  // نحول endDate لبداية اليوم عشان نقارن بالتاريخ فقط بدون الوقت
  const endDate = new Date(this.endDate);
  const isTomorrow =
    endDate.getFullYear() === tomorrow.getFullYear() &&
    endDate.getMonth() === tomorrow.getMonth() &&
    endDate.getDate() === tomorrow.getDate();

  console.log("willExpireTomorrow:", isTomorrow);
  return isTomorrow;
};

module.exports = mongoose.model("Subscription", subscriptionSchema);
