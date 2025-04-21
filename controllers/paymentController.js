const querystring = require("querystring");
const crypto = require("crypto");
const moment = require("moment");
const VNPAY_CONFIG = require("../config/vnpay");
const Payment = require("../models/Payment");
const { MealPlan, UserMealPlan, MealDay, Meal, MealTracking } = require("../models/MealPlan");
const Reminder = require("../models/Reminder");
const { agenda } = require("../config/agenda");
const UserModel = require("../models/UserModel");
const PaymentModel = require("../models/Payment");
const sendEmail = require("../utils/email");
const catchAsync = require("../utils/catchAsync");
const paymentService = require("../services/paymentService");
const SalaryPayment = require("../models/SalaryPayment");

exports.getAllPayments = catchAsync(async (req, res) => {
  const paymentStats = await paymentService.getAllPayments();
  res.status(200).json(paymentStats);
});

// Web-specific payment controllers
exports.createPaymentUrlWeb = catchAsync(async (req, res) => {
  const { userId, mealPlanId, amount } = req.body;
  const clientIp =
    req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.ip || "127.0.0.1";
  const { paymentUrl, paymentId } = await paymentService.createPaymentUrlWeb(
    userId,
    mealPlanId,
    amount,
    clientIp
  );
  res.json({ status: "success", paymentUrl, paymentId });
});

exports.vnpayReturnWeb = catchAsync(async (req, res) => {
  const vnp_Params = { ...req.query };
  const redirectUrl = await paymentService.vnpayReturnWeb(vnp_Params);
  res.redirect(redirectUrl);
});

// App-specific payment controllers
exports.createPaymentUrlApp = catchAsync(async (req, res) => {
  const { userId, mealPlanId, amount } = req.body;
  const clientIp =
    req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.ip || "127.0.0.1";
  const { paymentUrl, paymentId } = await paymentService.createPaymentUrlApp(
    userId,
    mealPlanId,
    amount,
    clientIp
  );
  res.json({ status: "success", paymentUrl, paymentId });
});
// chưa chia Controller Service
exports.vnpayReturnApp = catchAsync(async (req, res) => {
  console.log("vnpayReturnApp called at:", new Date().toISOString());
  console.log("Request method:", req.method); // Log phương thức yêu cầu (GET hoặc POST)
  console.log("Raw query:", req.query); // Log req.query để kiểm tra
  console.log("Raw body:", req.body); // Log req.body để kiểm tra

  const vnp_Params = req.query && Object.keys(req.query).length > 0 ? req.query : req.body;
  console.log("Received VNPay callback:", vnp_Params);

  if (!vnp_Params || Object.keys(vnp_Params).length === 0) {
    console.error("No parameters received from VNPay");
    return res.status(400).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Error</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f0f0f0;
            text-align: center;
          }
          .container {
            padding: 20px;
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
          h1 {
            color: #dc3545;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Lỗi</h1>
          <p>Không nhận được tham số từ VNPay. Vui lòng thử lại.</p>
        </div>
      </body>
      </html>
    `);
  }

  const result = await paymentService.handleVnpayReturnApp(vnp_Params);
  console.log("Result from handleVnpayReturnApp:", result);

  if (!result || typeof result !== "object") {
    throw new Error("Invalid result from handleVnpayReturnApp");
  }

  const { status, message } = result;

  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Result</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background-color: #f0f0f0;
          text-align: center;
        }
        .container {
          padding: 20px;
          background-color: white;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        h1 {
          color: ${status === "success" ? "#28a745" : "#dc3545"};
        }
        button {
          padding: 10px 20px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          margin-top: 20px;
        }
        button:hover {
          background-color: #0056b3;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${status === "success" ? "Thành công!" : "Thất bại"}</h1>
        <p>${message}</p>        
      </div>
    </body>
    </html>
  `);
});

exports.getPaymentHistory = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const paymentHistory = await paymentService.getPaymentHistory(userId, page, limit);
  res.json({ status: "success", ...paymentHistory });
});

exports.checkPaymentStatus = catchAsync(async (req, res) => {
  const { paymentId } = req.params;
  console.log("Received request to check payment status for paymentId:", paymentId);

  const paymentStatus = await paymentService.checkPaymentStatus(paymentId);

  res.json({
    status: "success",
    data: paymentStatus,
  });
});

exports.getPaymentById = catchAsync(async (req, res) => {
  const { paymentId } = req.params;
  const { _id: userId } = req.user;
  const paymentDetails = await paymentService.getPaymentById(paymentId, userId);
  res.json({ status: "success", data: paymentDetails });
});

exports.getPaymentHistoryForNutritionist = catchAsync(async (req, res) => {
  const payments = await paymentService.getPaymentHistoryForNutritionist();
  res.status(200).json({ success: true, data: payments });
});

exports.calculateSalary = catchAsync(async (req, res) => {
  const { nutriId } = req.params;
  const salaryData = await paymentService.calculateSalary(nutriId);
  res.status(200).json({ status: "success", data: salaryData });
});

exports.getSalaryPaymentHistory = catchAsync(async (req, res) => {
  const { nutriId } = req.params;
  const payments = await paymentService.getSalaryPaymentHistory(nutriId);
  res.status(200).json({ status: "success", data: payments });
});

exports.getSalaryHistoryByMonthYear = async (req, res) => {
  try {
    const { month, year } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Validate month and year
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required",
      });
    }

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        success: false,
        message: "Invalid month. Must be between 1 and 12",
      });
    }

    if (isNaN(yearNum) || yearNum < 2000 || yearNum > new Date().getFullYear() + 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid year",
      });
    }

    // Query salary payments with valid userId
    const query = {
      month: monthNum,
      year: yearNum,
      userId: { $ne: null, $exists: true }, // Chỉ lấy các bản ghi có userId
    };
    const salaryHistory = await SalaryPayment.find(query)
      .populate("userId", "username")
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPayments = await SalaryPayment.countDocuments(query);

    res.status(200).json({
      status: "success",
      data: salaryHistory,
      pagination: {
        total: totalPayments,
        page,
        limit,
        totalPages: Math.ceil(totalPayments / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching salary history by month and year:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Thanh toán lương cho nutritionist Admin
exports.acceptSalary = catchAsync(async (req, res, next) => {
  const { userId, amount, month, year } = req.body;

  // Kiểm tra nutritionist
  const nutritionist = await UserModel.findById(userId);
  if (!nutritionist || nutritionist.role !== "nutritionist") {
    return next(new AppError("Nutritionist not found or invalid role", 404));
  }

  // Kiểm tra xem đã thanh toán cho tháng này chưa
  const existingPayment = await SalaryPayment.findOne({
    userId,
    month,
    year,
    status: "success",
  });
  if (existingPayment) {
    return next(new AppError(`Salary for ${month}/${year} has already been paid`, 400));
  }

  // Tính lương cho tháng được chọn
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
  const mealPlans = await MealPlan.find({
    createdBy: userId,
    startDate: { $gte: startOfMonth, $lte: endOfMonth },
    isDelete: false,
  });

  const mealPlanIds = mealPlans.map((mp) => mp._id);
  const payments = await PaymentModel.find({
    mealPlanId: { $in: mealPlanIds },
    status: "success",
  });

  const baseSalary = 5000000;
  const commission = payments.reduce((sum, payment) => {
    const mealPlan = mealPlans.find((mp) => mp._id.toString() === payment.mealPlanId.toString());
    return sum + (mealPlan ? mealPlan.price * 0.1 : 0);
  }, 0);
  const totalSalary = baseSalary + commission;

  if (Math.round(totalSalary) !== Math.round(amount)) {
    return next(
      new AppError(
        `Calculated salary (${totalSalary}) does not match provided amount (${amount})`,
        400
      )
    );
  }

  // Tạo bản ghi thanh toán
  const payment = new SalaryPayment({
    userId,
    amount: totalSalary,
    status: "pending",
    paymentMethod: "vnpay",
    paymentType: "salary",
    month,
    year,
  });
  await payment.save();

  // Tạo URL thanh toán VNPay
  const clientIp =
    req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.ip || "127.0.0.1";
  const paymentData = await paymentService.acceptSalary(userId, amount, month, year, clientIp);
  res.status(200).json({ status: "success", data: paymentData });
});

exports.vnpayAdminReturn = catchAsync(async (req, res) => {
  const vnp_Params = req.query;
  const redirectUrl = await paymentService.vnpayAdminReturn(vnp_Params);
  res.redirect(redirectUrl);
});
