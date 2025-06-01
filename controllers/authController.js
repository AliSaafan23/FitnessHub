const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const bwipjs = require("bwip-js");
const { google } = require("googleapis");
const { Readable } = require("stream");

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone, fitnessGoal } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    user = new User({ name, email, password, role, phone, fitnessGoal });
    await user.save();

    // Generate and upload barcode only for trainee and trainer roles
    if (role === "trainee" || role === "trainer") {
      // Generate barcode image
      const barcodeBuffer = await new Promise((resolve, reject) => {
        bwipjs.toBuffer(
          {
            bcid: "code128",
            text: user.barcodeId,
            scale: 3,
            height: 10,
            includetext: true,
            textxalign: "center",
          },
          (err, png) => {
            if (err) reject(err);
            else resolve(png);
          }
        );
      });

      // Upload to Google Drive
      const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_DRIVE_KEY_PATH,
        scopes: ["https://www.googleapis.com/auth/drive"],
      });

      const drive = google.drive({ version: "v3", auth });

      const bufferStream = new Readable();
      bufferStream.push(barcodeBuffer);
      bufferStream.push(null);

      const fileMetadata = {
        name: `barcode_${user.barcodeId}.png`,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
      };

      const media = {
        mimeType: "image/png",
        body: bufferStream,
      };

      const file = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: "id, webViewLink",
      });

      // Update user with barcode URL
      user.barcodeUrl = file.data.webViewLink;
      await user.save();
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

    // Return role-specific response
    if (role === "trainee" || role === "trainer") {
      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            barcodeId: user.barcodeId,
            barcodeUrl: user.barcodeUrl,
          },
          token,
        },
      });
    } else {
      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          token,
        },
      });
    }
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    // Search for user by either email or phone
    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
    });

    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, token });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
