const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  url: { type: String, required: true },
  title: { type: String },
  description: { type: String },
  duration: { type: Number }, // in seconds
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Video", videoSchema);
