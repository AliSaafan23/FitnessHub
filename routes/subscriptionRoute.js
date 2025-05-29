const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscriptionController");
const verifyToken = require("../middlewares/verifyToken");

router.post("/:planId", verifyToken, subscriptionController.createSubscription);
router.get("/", verifyToken, subscriptionController.getSubscriptions);
router.put("/:subscriptionId/cancel", verifyToken, subscriptionController.cancelSubscription);
router.put("/:subscriptionId/auto-renew", verifyToken, subscriptionController.updateAutoRenewal);

module.exports = router;
