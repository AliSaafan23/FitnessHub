const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/verifyToken");
const {
  getSubscriptionNotifications,
  markSubscriptionNotificationAsRead,
} = require("../controllers/notificationController");

router.get("/", verifyToken, getSubscriptionNotifications);

router.put("/:notificationId/read", verifyToken, markSubscriptionNotificationAsRead);

module.exports = router;
