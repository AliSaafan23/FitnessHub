const multer = require("multer");
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
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 ميجا
});

module.exports = {
  upload,
  uploadProfilePic: upload.single("profilePic"), // For profile pictures
  uploadMedia: upload.single("media"), // For media uploads
  uploadMultiple: upload.fields([
    { name: "profilePic", maxCount: 1 },
    { name: "media", maxCount: 1 },
  ])
};
