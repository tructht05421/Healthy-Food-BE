const express = require("express");
const paymentRouter = express.Router();
const {
  createPaymentUrl,
  vnpayReturn,
  getAllPayments,
  getPaymentHistory,
  getPaymentById,
  getPaymentHistoryForNutritionist,
  checkPaymentStatus,
  getSalaryPaymentHistory,
  vnpayAdminReturn,
  acceptSalary,
  getSalaryHistoryByMonthYear,
  createPaymentUrlWeb,
  vnpayReturnWeb,
  createPaymentUrlApp,
  vnpayReturnApp,
} = require("../controllers/paymentController");
const { calculateSalary, sendSalaryEmail } = require("../controllers/paymentController");
const { isAuthenticated } = require("../middlewares/isAuthenticated");

// Routes cho VNPAY payment flow - Web
paymentRouter.post("/vnpay/pay", createPaymentUrlWeb);
paymentRouter.get("/vnpay/return", vnpayReturnWeb);

// Routes cho VNPAY payment flow - App
paymentRouter.post("/vnpay/app/pay", createPaymentUrlApp);
paymentRouter.get("/vnpay/app/return", vnpayReturnApp);

// Routes cho VNPAY admin return
paymentRouter.get("/vnpay/adminReturn", vnpayAdminReturn);

// Routes cho salary
paymentRouter.get("/salary-history-by-month-year", getSalaryHistoryByMonthYear);
paymentRouter.post("/accept-salary", acceptSalary);
paymentRouter.get("/salary-history/:nutriId", isAuthenticated, getSalaryPaymentHistory);
paymentRouter.get("/calculate-salary/:nutriId", isAuthenticated, calculateSalary);

// Routes cho payment history
paymentRouter.get("/history/nutritionist", isAuthenticated, getPaymentHistoryForNutritionist);
paymentRouter.get("/history/:userId", isAuthenticated, getPaymentHistory);

// Route cho check payment status
paymentRouter.get("/status/:paymentId", isAuthenticated, checkPaymentStatus);

// Routes cho payment CRUD
paymentRouter.get("/", getAllPayments);
paymentRouter.get("/:id", isAuthenticated, getPaymentById);

// Đã gộp route "/:paymentId" vào "/:id" vì chúng cùng chức năng
// paymentRouter.get("/:paymentId", isAuthenticated, getPaymentById);

module.exports = paymentRouter;
