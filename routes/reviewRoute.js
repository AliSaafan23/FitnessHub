const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const verifyToken = require("../middlewares/verifyToken");

router.post("/:trainerId", verifyToken, reviewController.createReview);
router.get("/trainer/:trainerId", reviewController.getTrainerReviews);
router.put("/:reviewId", verifyToken, reviewController.updateReview);
router.delete("/:reviewId", verifyToken, reviewController.deleteReview);

module.exports = router;
