require("dotenv").config();
const express = require("express");
const multer = require("multer");
const db = require("./config/db");
const authRoute = require("./routes/authRoute");
const userRoute = require("./routes/userRoute");
const planRoute = require("./routes/planRoute");
const advertisementRoute = require("./routes/advertisementRoute");
const reviewRoute = require("./routes/reviewRoute");
const subscriptionRoute = require("./routes/subscriptionRoute");
const notificationRoute = require("./routes/notificationRoute");
const subscriptionNotificationsRoute = require("./routes/subscriptionNotificationRoute");
const subscriptionNotificationService = require("./services/subscriptionNotificationService");
const inBodyReportRoute = require("./routes/inBodyReportRoute");
const app = express();
app.use(express.json());

//Routes
app.use("/api/auth", authRoute);
app.use("/api/user", userRoute);
app.use("/api/plan", planRoute);
app.use("/api/advertisements", advertisementRoute);
app.use("/api/reviews", reviewRoute);
app.use("/api/subscriptions", subscriptionRoute);
app.use("/api/notifications", notificationRoute);
app.use("/api/subscription-notifications", subscriptionNotificationsRoute);
app.use("/api/inbody", inBodyReportRoute);
// Global error handling
app.use((err, req, res, next) => {
  console.error("Error Stack:", err.stack);

  // Handle AWS credential errors
  if (err.message.includes("AWS credentials")) {
    return res.status(401).json({
      success: false,
      message: "AWS configuration error",
      error: err.message,
    });
  }
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: `Multer error: ${err.message}`,
    });
  }
  if (err.message.includes("Invalid file type")) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: err.message,
  });
});

// Schedule subscription expiration checks
setInterval(async () => {
  await subscriptionNotificationService.checkExpiredSubscriptions();
}, 60 * 1000); // Run every minute for testing

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await db.connection.asPromise();
    console.log("Connected to MongoDB");
    app.listen(3000, () => {
      console.log("Server running on http://localhost:3000");
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
