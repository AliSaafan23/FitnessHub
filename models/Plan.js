const mongoose = require("mongoose");

const planSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: String, required: true }, // e.g., "4 weeks", "3 months"
  trainer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
  price: {
    type: Number,
  },
  currency: {
    type: String,
    default: "USD",
  },
});

module.exports = mongoose.model("Plan", planSchema);
