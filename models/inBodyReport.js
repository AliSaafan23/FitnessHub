const mongoose = require("mongoose");

const inBodyReportSchema = new mongoose.Schema({
  trainee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  month: {
    type: Date,
    required: true,
  },
  bodyFat: {
    type: Number,
    min: 0,
    max: 100,
  },
  muscleMass: {
    type: Number,
    min: 0,
  },
  weight: {
    type: Number,
    min: 0,
  },
  bmi: {
    type: Number,
    min: 0,
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("InBodyReport", inBodyReportSchema);
