const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  mealPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MealPlan",
    required: false, // Changed to optional for salary payments
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "success", "failed"],
    default: "pending",
  },
  paymentMethod: {
    type: String,
    enum: ["vnpay", "momo", "cash", "vnpay_salary"], // Added "vnpay_salary"
    required: true,
  },
  paymentType: {
    type: String,
    enum: ["meal", "salary"], // Added to distinguish payment types
    default: "meal",
  },
  transactionNo: {
    type: String,
  },
  paymentDate: {
    type: Date,
  },
  paymentDetails: {
    type: Object,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
});

module.exports = mongoose.model("Payment", paymentSchema);
