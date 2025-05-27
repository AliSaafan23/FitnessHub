const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

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
    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const mimeType = req.file.mimetype;

    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_DRIVE_KEY_PATH,
      scopes: ["https://www.googleapis.com/auth/drive"],
    });

    const drive = google.drive({ version: "v3", auth });

    const fileMetadata = {
      name: fileName,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID], // Folder ID
    };

    const media = {
      mimeType: mimeType,
      body: fs.createReadStream(filePath),
    };

    const { data } = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id, webViewLink",
    });

    // حذف الملف المؤقت
    fs.unlinkSync(filePath);

    const user = await User.findByIdAndUpdate(req.user.id, { profilePic: data.webViewLink }, { new: true }).select(
      "-password"
    );

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.uploadMedia = async (req, res) => {
  try {
    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const mimeType = req.file.mimetype;
    const fileType = mimeType.startsWith("image/") ? "image" : "video";

    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_DRIVE_KEY_PATH,
      scopes: ["https://www.googleapis.com/auth/drive"],
    });

    const drive = google.drive({ version: "v3", auth });

    const fileMetadata = {
      name: fileName,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID], // Folder ID
    };

    const media = {
      mimeType: mimeType,
      body: fs.createReadStream(filePath),
    };

    const { data } = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id, webViewLink",
    });

    // حذف الملف المؤقت
    fs.unlinkSync(filePath);

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $push: {
          media: {
            url: data.webViewLink,
            type: fileType,
          },
        },
      },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
