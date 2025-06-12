const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const verifyToken = require("../middlewares/verifyToken");

router.get("/", verifyToken, notificationController.getUserNotifications);
router.put("/:notificationId/read", verifyToken, notificationController.markAsRead);

module.exports = router;
