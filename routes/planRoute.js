const express = require("express");
const router = express.Router();
const planController = require("../controllers/planController");
const verifyToken = require("../middlewares/verifyToken");

router.post("/", verifyToken, planController.createPlan);
router.get("/current-trainees", verifyToken, planController.getCurrentTraineesInPlans);
router.get("/:trainerId", verifyToken, planController.getPlans);
router.put("/:planId", verifyToken, planController.updatePlan);
router.delete("/:planId", verifyToken, planController.deletePlan);

module.exports = router;
