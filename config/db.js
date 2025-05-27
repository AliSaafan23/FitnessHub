const mongoose = require("mongoose");

// MongoDB connection URI from environment variables
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true, // This should be enough for modern MongoDB/Mongoose versions
    });
    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1); // Exit the process if DB connection fails
  }
};

// Call the connectDB function
connectDB();

// Connection Event Listeners
mongoose.connection.on("disconnected", () => {
  console.log("❌ MongoDB Disconnected");
});

mongoose.connection.on("reconnected", () => {
  console.log("✅ MongoDB Reconnected");
});

module.exports = mongoose; // Export mongoose instance
