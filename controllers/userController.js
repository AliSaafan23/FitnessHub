const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const Attendance = require("../models/Attendance");

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone, password, role, fitnessGoal } = req.body;
    const updateFields = { name, email, phone, role, fitnessGoal };

    if (password) {
      updateFields.password = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(req.user.id, updateFields, { new: true, runValidators: true }).select(
      "-password"
    );

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.uploadProfilePic = async (req, res) => {
  try {
    console.log("Starting upload process...");
    console.log("User ID:", req.user.id);
    console.log("File:", req.file);

    // 1. Verify the user exists
    const userExists = await User.findById(req.user.id);
    console.log("User found:", userExists);

    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: "User not found - Invalid user ID",
      });
    }

    // 2. Validate file
    if (!req.file || !req.file.googleDriveUrl) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded or upload failed",
      });
    }

    // 3. Update user with new profile picture
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { profilePic: req.file.googleDriveUrl },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    // 4. Verify update success
    if (!updatedUser) {
      console.error("Update failed for user:", req.user.id);
      return res.status(500).json({
        success: false,
        message: "Failed to update user profile picture",
      });
    }

    // 5. Return success response
    return res.status(200).json({
      success: true,
      message: "Profile picture uploaded successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profilePic: updatedUser.profilePic,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("Upload Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error uploading profile picture",
      error: error.message,
    });
  }
};
// Add a video to user's favorites
exports.addFavoriteVideo = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user is authenticated
    const { videoId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add video to favorites if not already present
    if (!user.favoriteVideos.includes(videoId)) {
      user.favoriteVideos.push(videoId);
      await user.save();
    }

    res.status(200).json({ message: "Video added to favorites", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Remove a video from user's favorites
exports.removeFavoriteVideo = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user is authenticated
    const { videoId } = req.params; // Assuming videoId is passed as a URL parameter

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove video from favorites
    user.favoriteVideos = user.favoriteVideos.filter((video) => video.toString() !== videoId);
    await user.save();

    res.status(200).json({ message: "Video removed from favorites", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get user's favorite videos
exports.getFavoriteVideos = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user is authenticated

    const user = await User.findById(userId).populate("favoriteVideos");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.favoriteVideos);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Scan barcode and get user info
exports.scanBarcode = async (req, res) => {
  try {
    const { barcodeId } = req.params;

    if (!["admin", "trainer", "gym_owner"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to scan barcodes",
      });
    }

    const user = await User.findOne({ barcodeId }).select("-password").populate("trainer", "name email");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invalid barcode",
      });
    }

    // Get today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const attendance = await Attendance.find({
      userId: user._id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        fitnessGoal: user.fitnessGoal,
        trainer: user.trainer,
        todayAttendance: attendance,
      },
    });
  } catch (error) {
    console.error("Scan Error:", error);
    res.status(500).json({
      success: false,
      message: "Error scanning barcode",
      error: error.message,
    });
  }
};

// Update recordAttendance method
exports.recordAttendance = async (req, res) => {
  try {
    const { barcodeId } = req.params;

    if (!["admin", "trainer", "gym_owner"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to record attendance",
      });
    }

    const user = await User.findOne({ barcodeId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invalid barcode",
      });
    }

    // Check for existing attendance today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await Attendance.findOne({
      userId: user._id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: "User already checked in today",
      });
    }

    // Record new attendance
    const attendance = new Attendance({
      userId: user._id,
      date: new Date(),
      checkInTime: new Date(),
      checkedBy: req.user.id,
      status: "present",
    });

    await attendance.save();

    res.status(200).json({
      success: true,
      message: "Attendance recorded successfully",
      data: {
        userId: user._id,
        name: user.name,
        checkInTime: attendance.checkInTime,
        checkedBy: req.user.name,
        status: attendance.status,
      },
    });
  } catch (error) {
    console.error("Attendance Error:", error);
    res.status(500).json({
      success: false,
      message: "Error recording attendance",
      error: error.message,
    });
  }
};

// Add new method to get user attendance history
exports.getAttendanceHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    const query = { userId };
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const attendance = await Attendance.find(query).populate("checkedBy", "name").sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error("Get Attendance Error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving attendance history",
      error: error.message,
    });
  }
};
