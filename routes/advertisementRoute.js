const express = require("express");
const router = express.Router();
const advertisementController = require("../controllers/advertisementController");
const verifyToken = require("../middlewares/verifyToken");
const { uploadMultiple } = require("../middlewares/upload");

router.post("/", verifyToken, uploadMultiple, advertisementController.createAd);
router.get("/", advertisementController.getAds);
router.get("/nearby", advertisementController.getAdsByLocation);
router.put("/stats/:adId", verifyToken, advertisementController.updateAdStats);
router.put("/:adId", verifyToken, advertisementController.updateAd);

module.exports = router;
