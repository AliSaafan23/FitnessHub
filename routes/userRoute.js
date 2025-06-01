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
router.get("/scan/:barcodeId", verifyToken, userController.scanBarcode);
router.post("/attendance/:barcodeId", verifyToken, userController.recordAttendance);
router.get("/attendance/history/:userId", verifyToken, userController.getAttendanceHistory);

module.exports = router;
