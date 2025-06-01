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
    sparse: true, // Allow null for non-trainee/trainer users
  },
  barcodeUrl: {
    type: String,
    sparse: true, // Allow null for non-trainee/trainer users
  },
});

// Update pre-save middleware to handle barcode generation
userSchema.pre("save", async function (next) {
  try {
    if (this.isModified("password")) {
      this.password = await bcrypt.hash(this.password, 10);
    }

    // Generate barcodeId only for trainee and trainer roles
    if ((this.role === "trainee" || this.role === "trainer") && !this.barcodeId) {
      const prefix = this.role === "trainee" ? "FHT" : "FHR"; // Different prefix for trainee/trainer
      const timestamp = Date.now().toString();
      const random = Math.floor(1000 + Math.random() * 9000).toString();
      this.barcodeId = `${prefix}${timestamp.slice(-6)}${random}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("User", userSchema);
