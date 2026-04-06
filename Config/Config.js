const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://user:Suggestmeapasswordwith1@cluster0.xqipfwr.mongodb.net/?appName=Cluster0");

    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ DB Connection Failed:", error.message);
    process.exit(1);
  }
};
// 📧 Email Transport (Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
  }
});

module.exports = { connectDB, transporter };