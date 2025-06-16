const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const verifyToken = require("../middlewares/verifyToken");
const validator = require("../middlewares/validations/validator");

router.post("/register", validator, authController.register);
router.post("/login", validator, authController.login);
router.post("/request-otp", authController.requestOtp);
router.post("/verify-otp", authController.verifyOtp);
module.exports = router;
