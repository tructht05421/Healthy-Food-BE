const mongoose = require("mongoose");

const salaryPaymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ["success", "pending"], default: "success" },
  paymentDate: { type: Date, default: Date.now },
  transactionNo: { type: String },
  month: { type: Number, required: true }, // Tháng (1-12)
  year: { type: Number, required: true }, // Năm (ví dụ: 2025)
});

module.exports = mongoose.model("SalaryPayment", salaryPaymentSchema);
