const multer = require("multer");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const allowedImageTypes = ["image/jpeg", "image/png", "image/gif"];
const allowedVideoTypes = ["video/mp4", "video/mpeg", "video/webm"];

const fileFilter = (req, file, cb) => {
  if (allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images (JPEG, PNG, GIF) and videos (MP4, MPEG, WebM) are allowed."), false);
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "Uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

const uploadToGoogleDrive = async (file) => {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_DRIVE_KEY_PATH,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  const drive = google.drive({ version: "v3", auth });

  const fileMetadata = {
    name: file.originalname,
    parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
  };

  const media = {
    mimeType: file.mimetype,
    body: fs.createReadStream(file.path),
  };

  const { data } = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: "id, webViewLink",
  });

  fs.unlinkSync(file.path); // Delete temporary file
  return data.webViewLink;
};

module.exports = {
  upload,
  uploadProfilePic: upload.single("profilePic"),
  uploadMedia: upload.single("media"),
  uploadMultiple: [
    upload.fields([
      { name: "profilePic", maxCount: 1 },
      { name: "media", maxCount: 1 },
    ]),
    async (req, res, next) => {
      try {
        if (!req.files || (!req.files.profilePic && !req.files.media)) {
          return res.status(400).json({ message: "No files uploaded" });
        }

        // Upload files to Google Drive and replace local paths with Google Drive URLs
        if (req.files.profilePic) {
          const googleDriveUrl = await uploadToGoogleDrive(req.files.profilePic[0]);
          req.files.profilePic[0].googleDriveUrl = googleDriveUrl;
        }
        if (req.files.media) {
          const googleDriveUrl = await uploadToGoogleDrive(req.files.media[0]);
          req.files.media[0].googleDriveUrl = googleDriveUrl;
        }

        next();
      } catch (error) {
        console.error("Google Drive upload error:", error);
        res.status(500).json({ message: "Error uploading to Google Drive", error: error.message });
      }
    },
  ],
};
