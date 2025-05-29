const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const videoController = require("../controllers/videoController");
const verifyToken = require("../middlewares/verifyToken");
const { uploadProfilePic, uploadMedia } = require("../middlewares/upload");

router.get("/profile", verifyToken, userController.getProfile);
router.put("/profile", verifyToken, userController.updateProfile);
router.post("/upload-pic", verifyToken, uploadProfilePic, userController.uploadProfilePic);
router.post("/upload-video", verifyToken, uploadMedia, videoController.uploadVideo);
router.get("/videos/:userId", videoController.getUserVideos);

module.exports = router;
