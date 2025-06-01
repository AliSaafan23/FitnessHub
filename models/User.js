const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const bwipjs = require("bwip-js");
const { google } = require("googleapis");
const { Readable } = require("stream");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["trainee", "trainer", "gym_owner", "admin"], required: true },
  profilePic: { type: String },
  fitnessGoal: { type: String, enum: ["weight_loss", "muscle_gain", "general_fitness"] },
  favoriteVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
  trainer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  barcodeId: {
    type: String,
    unique: true,
  },
  barcodeUrl: {
    type: String,
  },
});

// Generate barcode before saving
userSchema.pre("save", async function (next) {
  try {
    if (this.isModified("password")) {
      this.password = await bcrypt.hash(this.password, 10);
    }

    // Generate barcodeId if not exists
    if (!this.barcodeId) {
      const timestamp = Date.now().toString();
      const random = Math.floor(1000 + Math.random() * 9000).toString();
      this.barcodeId = `FH${timestamp.slice(-6)}${random}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("User", userSchema);
