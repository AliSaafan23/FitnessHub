const Video = require("../models/Video");
const { google } = require("googleapis");
const fs = require("fs");

exports.uploadVideo = async (req, res) => {
  try {
    if (req.user.role !== "trainer" && req.user.role !== "admin" && req.user.role !== "gym_owner") {
      return res.status(403).json({ message: "Only (trainers & gym_owners & admin) can upload videos" });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;

    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_DRIVE_KEY_PATH,
      scopes: ["https://www.googleapis.com/auth/drive"],
    });

    const drive = google.drive({ version: "v3", auth });

    const fileMetadata = {
      name: fileName,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    };

    const media = {
      mimeType: req.file.mimetype,
      body: fs.createReadStream(filePath),
    };

    const { data } = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id, webViewLink",
    });

    fs.unlinkSync(filePath);

    const video = new Video({
      userId: req.user.id,
      url: data.webViewLink,
      title: req.body.title,
      description: req.body.description,
      duration: req.body.duration,
    });

    await video.save();
    res.status(201).json(video);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getUserVideos = async (req, res) => {
  try {
    const videos = await Video.find({ userId: req.params.userId }).sort({ uploadedAt: -1 });

    if (!videos || videos.length === 0) {
      return res.status(404).json({ message: "No videos found for this user" });
    }

    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
