const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const verifyToken = require("../middlewares/verifyToken");

router.post("/register", authController.register);
router.post("/login", authController.login);

module.exports = router;
