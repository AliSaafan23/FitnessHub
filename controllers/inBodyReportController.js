const InBodyReport = require("../models/InBodyReport");

exports.uploadInBodyReport = async (req, res) => {
  try {
    const { month, bodyFat, muscleMass, weight, bmi, notes } = req.body;

    if (!req.file || !req.file.googleDriveUrl) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded or upload failed",
      });
    }

    const newReport = new InBodyReport({
      trainee: req.user.id,
      uploadedBy: req.user.id,
      fileUrl: req.file.googleDriveUrl,
      month,
      bodyFat: bodyFat || undefined,
      muscleMass: muscleMass || undefined,
      weight: weight || undefined,
      bmi: bmi || undefined,
      notes,
    });

    await newReport.save();

    res.status(201).json({
      success: true,
      message: "InBody report uploaded successfully",
      data: newReport,
    });
  } catch (error) {
    console.error("Upload InBody Report Error:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading InBody report",
      error: error.message,
    });
  }
};

exports.getInBodyReports = async (req, res) => {
  try {
    const reports = await InBodyReport.find({ trainee: req.user.id })
      .sort({ month: -1 })
      .populate("uploadedBy", "name");

    res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error("Get InBody Reports Error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving InBody reports",
      error: error.message,
    });
  }
};
