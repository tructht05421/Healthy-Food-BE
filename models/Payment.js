const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mealPlanId: { type: mongoose.Schema.Types.ObjectId, ref: "MealPlan", required: true },
    amount: { type: Number, required: true },
    transactionNo: { type: String }, // Mã giao dịch từ VNPay
    paymentMethod: { type: String, enum: ["vnpay", "momo", "cash"], default: "vnpay" },
    status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
    paymentDate: { type: Date },
    paymentDetails: { type: mongoose.Schema.Types.Mixed }, // Lưu JSON từ VNPay, tránh Object quá chung chung
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
