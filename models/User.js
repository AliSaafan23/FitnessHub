const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
