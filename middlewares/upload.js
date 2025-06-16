const multer = require("multer");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

// Allowed types
const allowedImageTypes = ["image/jpeg", "image/png", "image/gif"];
const allowedVideoTypes = ["video/mp4", "video/mpeg", "video/webm"];
const allowedDocumentTypes = ["application/pdf"];

// File filter
const fileFilter = (req, file, cb) => {
  if (
    allowedImageTypes.includes(file.mimetype) ||
    allowedVideoTypes.includes(file.mimetype) ||
    allowedDocumentTypes.includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only images (JPEG, PNG, GIF), videos (MP4, MPEG, WebM), and PDF files are allowed."
      ),
      false
    );
  }
};

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "Uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Upload to Google Drive
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

  fs.unlinkSync(file.path); // delete local file after upload
  return data.webViewLink;
};

// Exports
module.exports = {
  upload,

  uploadProfilePic: [
    upload.single("profilePic"),
    async (req, res, next) => {
      try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });

        const googleDriveUrl = await uploadToGoogleDrive(req.file);
        req.file.googleDriveUrl = googleDriveUrl;

        next();
      } catch (error) {
        console.error("Google Drive upload error:", error);
        res.status(500).json({ message: "Failed to upload to Google Drive", error: error.message });
      }
    },
  ],

  uploadMedia: upload.single("media"),

  uploadPdf: [
    upload.single("pdf"),
    async (req, res, next) => {
      try {
        if (!req.file) return res.status(400).json({ message: "No PDF uploaded" });

        const googleDriveUrl = await uploadToGoogleDrive(req.file);
        req.file.googleDriveUrl = googleDriveUrl;

        next();
      } catch (error) {
        console.error("Google Drive upload error:", error);
        res.status(500).json({ message: "Failed to upload PDF", error: error.message });
      }
    },
  ],

  uploadMultiple: [
    upload.fields([
      { name: "profilePic", maxCount: 1 },
      { name: "media", maxCount: 1 },
      { name: "pdf", maxCount: 1 },
    ]),
    async (req, res, next) => {
      try {
        if (!req.files || (!req.files.profilePic && !req.files.media && !req.files.pdf)) {
          return res.status(400).json({ message: "No files uploaded" });
        }

        if (req.files.profilePic) {
          const url = await uploadToGoogleDrive(req.files.profilePic[0]);
          req.files.profilePic[0].googleDriveUrl = url;
        }

        if (req.files.media) {
          const url = await uploadToGoogleDrive(req.files.media[0]);
          req.files.media[0].googleDriveUrl = url;
        }

        if (req.files.pdf) {
          const url = await uploadToGoogleDrive(req.files.pdf[0]);
          req.files.pdf[0].googleDriveUrl = url;
        }

        next();
      } catch (error) {
        console.error("Google Drive upload error:", error);
        res.status(500).json({ message: "Error uploading to Google Drive", error: error.message });
      }
    },
  ],
};
