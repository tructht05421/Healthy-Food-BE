// models/tempOtpModel.js
const mongoose = require("mongoose");

const tempOtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    trim: true,
    lowercase: true,
  },
  otp: {
    type: String,
    required: [true, "OTP is required"],
  },
  otpExpires: {
    type: Date,
    required: [true, "OTP expiration time is required"],
    index: { expires: "24h" }, // Tự động xóa sau 24 giờ
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const TempOTP = mongoose.model("TempOTP", tempOtpSchema);

module.exports = TempOTP;
