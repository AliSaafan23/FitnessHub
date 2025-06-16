const express = require("express");
const router = express.Router();
const inBodyReportController = require("../controllers/inBodyReportController");
const verifyToken = require("../middlewares/verifyToken");
const { uploadPdf } = require("../middlewares/upload");

router.post("/upload", verifyToken, uploadPdf, inBodyReportController.uploadInBodyReport);

router.get("/", verifyToken, inBodyReportController.getInBodyReports);

module.exports = router;
