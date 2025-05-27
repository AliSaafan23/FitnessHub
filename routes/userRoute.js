const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const verifyToken = require("../middlewares/verifyToken");
const { uploadProfilePic, uploadMedia, uploadMultiple } = require("../middlewares/upload");

router.get("/profile", verifyToken, userController.getProfile);
router.put("/profile", verifyToken, userController.updateProfile);

// رفع صورة بروفايل
router.post("/upload-pic", verifyToken, uploadProfilePic, userController.uploadProfilePic);

// رفع فيديو أو صورة ميديا واحدة
router.post("/upload-media", verifyToken, uploadMedia, userController.uploadMedia);
module.exports = router;
