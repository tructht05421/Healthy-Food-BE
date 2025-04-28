const querystring = require("querystring");
const crypto = require("crypto");
const moment = require("moment");
const VNPAY_CONFIG = require("../config/vnpay");
const Payment = require("../models/Payment");
const { MealPlan, UserMealPlan } = require("../models/MealPlan");
const UserModel = require("../models/UserModel");
const SalaryPayment = require("../models/SalaryPayment");
const sendEmail = require("../utils/email");
const AppError = require("../utils/appError");

exports.getAllPayments = async () => {
  const payments = await Payment.find();

  const revenueByMonth = {};
  const totalRevenue = payments.reduce((acc, payment) => {
    return payment.status === "success" ? acc + payment.amount : acc;
  }, 0);

  const paymentStats = payments.reduce(
    (acc, payment) => {
      if (payment.status === "success") acc.paid += 1;
      else acc.unpaid += 1;
      return acc;
    },
    { paid: 0, unpaid: 0 }
  );

  payments.forEach((payment) => {
    if (payment.status === "success") {
      const year = moment(payment.paymentDate).format("YYYY");
      const month = moment(payment.paymentDate).format("MM");
      if (!revenueByMonth[year]) revenueByMonth[year] = {};
      if (!revenueByMonth[year][month]) revenueByMonth[year][month] = 0;
      revenueByMonth[year][month] += payment.amount;
    }
  });

  const revenueByYear = payments.reduce((acc, payment) => {
    const year = new Date(payment.paymentDate).getFullYear();
    acc[year] = (acc[year] || 0) + payment.amount;
    return acc;
  }, {});

  return { totalRevenue, paymentStats, revenueByYear, revenueByMonth };
};
// Helper function for common payment validation and creation
const createPayment = async (userId, mealPlanId, amount) => {
  if (!userId || !mealPlanId || !amount) {
    throw Object.assign(new Error("Thiếu userId, mealPlanId hoặc amount"), { status: 400 });
  }
  if (isNaN(amount) || amount <= 0) {
    throw Object.assign(new Error("Amount phải là số dương"), { status: 400 });
  }

  const mealPlan = await MealPlan.findById(mealPlanId);
  if (!mealPlan) {
    throw Object.assign(new Error("MealPlan không tồn tại"), { status: 400 });
  }

  const successPayment = await Payment.findOne({ mealPlanId, status: "success" });
  if (successPayment) {
    throw Object.assign(new Error("MealPlan này đã được thanh toán"), { status: 400 });
  }

  let payment = await Payment.findOne({
    mealPlanId,
    userId,
    status: "pending",
    createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });

  if (!payment) {
    payment = new Payment({
      userId,
      mealPlanId,
      amount,
      status: "pending",
      paymentMethod: "vnpay",
    });
    await payment.save();
  } else if (payment.amount !== amount) {
    payment.amount = amount;
    payment.updatedAt = new Date();
    await payment.save();
  }

  return payment;
};

// Helper function for generating VNPAY payment URL
const generatePaymentUrl = (payment, amount, clientIp, vnp_ReturnUrl, mealPlanId) => {
  const vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: VNPAY_CONFIG.vnp_TmnCode || "",
    vnp_Amount: Math.round(amount * 100).toString(),
    vnp_CurrCode: "VND",
    vnp_TxnRef: payment._id.toString(),
    vnp_OrderInfo: `Thanh toán MealPlan: ${mealPlanId}`,
    vnp_OrderType: "180000",
    vnp_Locale: "vn",
    vnp_ReturnUrl, // Use the provided vnp_ReturnUrl directly
    vnp_IpAddr: clientIp,
    vnp_CreateDate: moment().format("YYYYMMDDHHmmss"),
  };

  const sortedParams = Object.fromEntries(
    Object.entries(vnp_Params)
      .map(([key, value]) => [key, String(value || "").trim()])
      .sort()
  );
  const signData = new URLSearchParams(sortedParams).toString();
  if (!VNPAY_CONFIG.vnp_HashSecret) throw new Error("vnp_HashSecret không tồn tại hoặc rỗng!");
  const secureHash = crypto
    .createHmac("sha512", VNPAY_CONFIG.vnp_HashSecret)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  sortedParams["vnp_SecureHash"] = secureHash;
  return `${VNPAY_CONFIG.vnp_Url}?${new URLSearchParams(sortedParams).toString()}`;
};

// Helper function for handling VNPAY return logic WEB
const handleVnpayReturn = async (vnp_Params, baseUrl) => {
  const secureHash = vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  const sortedParams = Object.fromEntries(
    Object.entries(vnp_Params)
      .map(([key, value]) => [key, String(value || "").trim()])
      .sort()
  );
  const signData = new URLSearchParams(sortedParams).toString();
  const signed = crypto
    .createHmac("sha512", VNPAY_CONFIG.vnp_HashSecret)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  if (secureHash !== signed) {
    return `${baseUrl}/mealplan?status=error&message=Invalid+signature`;
  }

  const transactionNo = vnp_Params["vnp_TransactionNo"];
  const paymentId = vnp_Params["vnp_TxnRef"];
  const responseCode = vnp_Params["vnp_ResponseCode"];
  const status = responseCode === "00" ? "success" : "failed";

  const payment = await Payment.findByIdAndUpdate(
    paymentId,
    { transactionNo, status, paymentDate: new Date(), paymentDetails: vnp_Params },
    { new: true }
  );
  if (!payment) {
    return `${baseUrl}/mealplan?status=error&message=Payment+not+found`;
  }

  if (status === "success") {
    const updatedMealPlan = await MealPlan.findByIdAndUpdate(
      payment.mealPlanId,
      { paymentId: payment._id, isBlock: false },
      { new: true }
    );
    if (!updatedMealPlan) {
      return `${baseUrl}/mealplan?status=error&message=MealPlan+not+found`;
    }

    const oldUserMealPlan = await UserMealPlan.findOne({ userId: payment.userId });
    if (oldUserMealPlan) {
      oldUserMealPlan.mealPlanId = payment.mealPlanId;
      oldUserMealPlan.startDate = new Date();
      await oldUserMealPlan.save();
    } else {
      await UserMealPlan.create({
        userId: payment.userId,
        mealPlanId: payment.mealPlanId,
        startDate: new Date(),
      });
    }

    await Payment.deleteMany({
      _id: { $ne: payment._id },
      mealPlanId: payment.mealPlanId,
      status: "pending",
    });
  }

  return `${baseUrl}/mealplan?status=${status}&message=${
    status === "success" ? "Thanh+toán+thành+công" : "Thanh+toán+thất+bại"
  }`;
};
// Helper function for handling VNPAY return logic for APP
exports.handleVnpayReturnApp = async (vnp_Params) => {
  try {
    console.log("vnp_Params in handleVnpayReturnApp:", vnp_Params);

    if (!vnp_Params || typeof vnp_Params !== "object") {
      throw new Error("Invalid VNPay parameters");
    }

    const secureHash = vnp_Params["vnp_SecureHash"];
    if (!secureHash) {
      throw new Error("vnp_SecureHash is missing");
    }

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    const sortedParams = Object.fromEntries(
      Object.entries(vnp_Params)
        .map(([key, value]) => [key, String(value || "").trim()])
        .sort()
    );
    const signData = new URLSearchParams(sortedParams).toString();
    console.log("Sign data:", signData);

    const signed = crypto
      .createHmac("sha512", VNPAY_CONFIG.vnp_HashSecret)
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex");
    console.log("Computed secureHash:", signed);
    console.log("Provided secureHash:", secureHash);

    if (secureHash !== signed) {
      throw new Error("Invalid signature");
    }

    const transactionNo = vnp_Params["vnp_TransactionNo"];
    const paymentId = vnp_Params["vnp_TxnRef"];
    const responseCode = vnp_Params["vnp_ResponseCode"];
    const status = responseCode === "00" ? "success" : "failed";

    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      { transactionNo, status, paymentDate: new Date(), paymentDetails: vnp_Params },
      { new: true }
    );
    if (!payment) {
      throw new Error(`Payment not found for paymentId: ${paymentId}`);
    }

    if (status === "success") {
      const updatedMealPlan = await MealPlan.findByIdAndUpdate(
        payment.mealPlanId,
        { paymentId: payment._id, isBlock: false },
        { new: true }
      );
      if (!updatedMealPlan) {
        throw new Error(`MealPlan not found for mealPlanId: ${payment.mealPlanId}`);
      }

      const oldUserMealPlan = await UserMealPlan.findOne({ userId: payment.userId });
      if (oldUserMealPlan) {
        oldUserMealPlan.mealPlanId = payment.mealPlanId;
        oldUserMealPlan.startDate = new Date();
        await oldUserMealPlan.save();
      } else {
        await UserMealPlan.create({
          userId: payment.userId,
          mealPlanId: payment.mealPlanId,
          startDate: new Date(),
        });
      }

      await Payment.deleteMany({
        _id: { $ne: payment._id },
        mealPlanId: payment.mealPlanId,
        status: "pending",
      });
    }

    return {
      success: true,
      status: status,
      message:
        status === "success"
          ? "Thanh toán thành công! Vui lòng quay lại ứng dụng để tiếp tục."
          : "Thanh toán thất bại. Vui lòng quay lại ứng dụng và thử lại.",
    };
  } catch (error) {
    console.error("Error in handleVnpayReturnApp:", error);
    return {
      success: false,
      status: "error",
      message: error.message || "Đã có lỗi xảy ra khi xử lý thanh toán.",
    };
  }
};
// Web-specific payment services
exports.createPaymentUrlWeb = async (userId, mealPlanId, amount, clientIp) => {
  const payment = await createPayment(userId, mealPlanId, amount);
  const paymentUrl = generatePaymentUrl(
    payment,
    amount,
    clientIp,
    VNPAY_CONFIG.vnp_ReturnUrl_Web, // e.g., http://localhost:8080/api/v1/payment/vnpay/return
    mealPlanId
  );
  return { paymentUrl, paymentId: payment._id };
};

exports.vnpayReturnWeb = async (vnp_Params) => {
  return handleVnpayReturn(vnp_Params, process.env.ADMIN_WEB_URL); // e.g., http://localhost:3000
};

// App-specific payment services
exports.createPaymentUrlApp = async (userId, mealPlanId, amount, clientIp) => {
  const payment = await createPayment(userId, mealPlanId, amount);
  const paymentUrl = generatePaymentUrl(
    payment,
    amount,
    clientIp,
    VNPAY_CONFIG.vnp_ReturnUrl_App, // e.g., http://192.168.1.70:8080/api/v1/payment/vnpay/app/return
    mealPlanId
  );
  return { paymentUrl, paymentId: payment._id };
};
// xử lí view trên trình duyệt
exports.vnpayReturnApp = async (req, res) => {
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

  try {
    const result = await handleVnpayReturnApp(vnp_Params);
    console.log("Result from handleVnpayReturnApp:", result);

    if (!result || typeof result !== "object") {
      throw new Error("Invalid result from handleVnpayReturnApp");
    }

    const { status, message } = result; // Dòng 329: Lỗi xảy ra tại đây

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
          <button onclick="window.location.href='healthyfood://payment'">Quay lại ứng dụng</button>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("Error in vnpayReturnApp:", error);
    res.status(500).send(`
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
          <p>Đã có lỗi xảy ra: ${error.message}. Vui lòng quay lại ứng dụng và thử lại.</p>
        </div>
      </body>
      </html>
    `);
  }
};

exports.getPaymentHistory = async (userId, page, limit) => {
  const skip = (page - 1) * limit;
  const payments = await Payment.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  if (!payments || payments.length === 0) {
    throw Object.assign(new Error("Không tìm thấy lịch sử thanh toán"), { status: 404 });
  }

  const paymentDetails = await Promise.all(
    payments.map(async (payment) => {
      const mealPlan = await MealPlan.findById(payment.mealPlanId).select("title").lean();
      return {
        _id: payment._id,
        mealPlanName: mealPlan ? mealPlan.title : "N/A",
        amount: payment.amount,
        status: payment.status,
        createdAt: payment.createdAt,
        paymentDate: payment.paymentDate,
        vnpayTransactionId: payment.transactionNo || "N/A",
      };
    })
  );

  const totalPayments = await Payment.countDocuments({ userId });
  return {
    data: paymentDetails,
    pagination: { total: totalPayments, page, limit, totalPages: Math.ceil(totalPayments / limit) },
  };
};
//FIX APP
exports.checkPaymentStatus = async (paymentId) => {
  try {
    console.log("Checking payment status for paymentId:", paymentId);
    const payment = await Payment.findById(paymentId).populate("mealPlanId");
    console.log("Payment found:", payment);

    if (!payment) {
      throw Object.assign(new Error("Payment not found"), { status: 404 });
    }

    if (!payment.status) {
      console.warn("Payment status is missing for payment:", payment);
      payment.status = "pending"; // Gán giá trị mặc định nếu thiếu
      await payment.save();
    }

    const paymentData = {
      paymentId: payment._id.toString(), // Đảm bảo là string để FE dễ xử lý
      status: payment.status, // "pending", "success", hoặc "failed"
      amount: payment.amount, // Số tiền
      mealPlanId: payment.mealPlanId?._id?.toString() || payment.mealPlanId?.toString() || null, // Đảm bảo mealPlanId là string hoặc null
      mealPlanName: payment.mealPlanId?.title || payment.mealPlanName || "Untitled Meal Plan", // Đảm bảo luôn có tên
      createdAt: payment.createdAt, // Thời gian tạo
      paymentDate: payment.paymentDate || null, // Thời gian thanh toán, có thể là null
    };

    console.log("Payment data prepared:", paymentData);
    return paymentData;
  } catch (error) {
    console.error("Error in checkPaymentStatus:", error);
    throw error; // Ném lỗi để controller xử lý
  }
};

exports.getPaymentById = async (paymentId, userId) => {
  const payment = await Payment.findById(paymentId).lean();
  if (!payment) {
    throw Object.assign(new Error("Payment information not found"), { status: 404 });
  }

  const mealPlan = await MealPlan.findById(payment.mealPlanId).lean();
  if (!mealPlan) {
    throw Object.assign(new Error("Related MealPlan not found"), { status: 404 });
  }

  if (mealPlan.createdBy.toString() !== userId.toString()) {
    throw Object.assign(new Error("You do not have permission to view this payment information."), {
      status: 403,
    });
  }

  const mealPlanDetails = await MealPlan.findById(payment.mealPlanId)
    .select("title price startDate endDate")
    .lean();

  return {
    _id: payment._id,
    userId: payment.userId,
    mealPlanId: payment.mealPlanId,
    mealPlanName: mealPlanDetails ? mealPlanDetails.title : "N/A",
    amount: payment.amount,
    status: payment.status,
    paymentMethod: payment.paymentMethod,
    transactionNo: payment.transactionNo || "N/A",
    paymentDate: payment.paymentDate || null,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
    paymentDetails: payment.paymentDetails || {},
    mealPlanInfo: mealPlanDetails
      ? {
          title: mealPlanDetails.title,
          price: mealPlanDetails.price,
          startDate: mealPlanDetails.startDate,
          endDate: mealPlanDetails.endDate,
        }
      : null,
  };
};

exports.getPaymentHistoryForNutritionist = async () => {
  const mealPlans = await MealPlan.find().lean();
  if (!mealPlans || mealPlans.length === 0) return [];
  return await Payment.find().lean();
};

exports.calculateSalary = async (nutriId) => {
  const nutritionist = await UserModel.findById(nutriId);
  if (!nutritionist || nutritionist.role !== "nutritionist") {
    throw new AppError("Nutritionist not found or invalid role", 404);
  }

  const mealPlans = await MealPlan.find({ createdBy: nutriId }).populate("userId", "username");
  const mealPlanIds = mealPlans.map((mp) => mp._id);
  const payments = await Payment.find({ mealPlanId: { $in: mealPlanIds } });

  const baseSalary = 5000000;
  const commission = payments
    .filter((payment) => payment.status === "success")
    .reduce((sum, payment) => {
      const mealPlan = mealPlans.find((mp) => mp._id.toString() === payment.mealPlanId.toString());
      return sum + (mealPlan ? mealPlan.price * 0.1 : 0);
    }, 0);

  const totalSalary = baseSalary + commission;

  return {
    nutritionist: { id: nutritionist._id, name: nutritionist.username },
    salary: { baseSalary, commission, totalSalary },
  };
};

exports.getSalaryPaymentHistory = async (nutriId) => {
  return await Payment.find({ userId: nutriId, paymentType: "salary" }).sort({ createdAt: -1 });
};

exports.getSalaryHistoryByMonthYear = async (month, year, page, limit) => {
  const monthNum = parseInt(month);
  const yearNum = parseInt(year);
  if (!month || !year)
    throw Object.assign(new Error("Month and year are required"), { status: 400 });
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    throw Object.assign(new Error("Invalid month. Must be between 1 and 12"), { status: 400 });
  }
  if (isNaN(yearNum) || yearNum < 2000 || yearNum > new Date().getFullYear() + 1) {
    throw Object.assign(new Error("Invalid year"), { status: 400 });
  }

  const skip = (page - 1) * limit;
  const query = { month: monthNum, year: yearNum };
  const salaryHistory = await SalaryPayment.find(query)
    .populate("userId", "username")
    .sort({ paymentDate: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalPayments = await SalaryPayment.countDocuments(query);
  return {
    data: salaryHistory,
    pagination: { total: totalPayments, page, limit, totalPages: Math.ceil(totalPayments / limit) },
  };
};
const createSalaryPayment = async (userId, amount, month, year) => {
  // Validation đầu vào
  if (!userId || !amount || !month || !year) {
    throw new AppError("Thiếu userId, amount, month hoặc year", 400);
  }
  if (isNaN(amount) || amount <= 0) {
    throw new AppError("Amount phải là số dương", 400);
  }
  if (isNaN(month) || month < 1 || month > 12) {
    throw new AppError("Invalid month. Must be between 1 and 12", 400);
  }
  if (isNaN(year) || year < 2000 || year > new Date().getFullYear() + 1) {
    throw new AppError("Invalid year", 400);
  }

  // Kiểm tra nutritionist
  const nutritionist = await UserModel.findById(userId);
  if (!nutritionist || nutritionist.role !== "nutritionist") {
    throw new AppError("Nutritionist not found or invalid role", 404);
  }

  // Kiểm tra xem đã thanh toán lương cho tháng này chưa
  const existingPayment = await SalaryPayment.findOne({ userId, month, year, status: "success" });
  if (existingPayment) {
    throw new AppError(`Salary for ${month}/${year} has already been paid`, 400);
  }

  // Tính lương
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
  const mealPlans = await MealPlan.find({
    createdBy: userId,
    startDate: { $gte: startOfMonth, $lte: endOfMonth },
    isDelete: false,
  });

  const mealPlanIds = mealPlans.map((mp) => mp._id);
  const payments = await Payment.find({ mealPlanId: { $in: mealPlanIds }, status: "success" });

  const baseSalary = 5000000;
  const commission = payments.reduce((sum, payment) => {
    const mealPlan = mealPlans.find((mp) => mp._id.toString() === payment.mealPlanId.toString());
    return sum + (mealPlan ? mealPlan.price * 0.1 : 0);
  }, 0);
  const totalSalary = baseSalary + commission;

  // Kiểm tra tính hợp lệ của amount
  if (Math.round(totalSalary) !== Math.round(amount)) {
    throw new AppError(
      `Calculated salary (${totalSalary}) does not match provided amount (${amount})`,
      400
    );
  }

  // Tìm hoặc tạo bản ghi SalaryPayment
  let payment = await SalaryPayment.findOne({
    userId,
    month,
    year,
    status: "pending",
    createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });

  if (!payment) {
    payment = new SalaryPayment({
      userId,
      amount: totalSalary,
      status: "pending",
      paymentMethod: "vnpay",
      paymentType: "salary",
      month,
      year,
    });
    await payment.save();
  } else if (payment.amount !== totalSalary) {
    payment.amount = totalSalary;
    payment.updatedAt = new Date();
    await payment.save();
  }

  return { payment, nutritionist, totalSalary };
};

exports.acceptSalary = async (userId, amount, month, year, clientIp) => {
  // Validation và tạo SalaryPayment
  const { payment, nutritionist, totalSalary } = await createSalaryPayment(
    userId,
    amount,
    month,
    year
  );

  // Kiểm tra clientIp
  if (!clientIp || typeof clientIp !== "string") {
    throw new AppError("Invalid client IP address", 400);
  }

  // Kiểm tra cấu hình VNPay
  if (!VNPAY_CONFIG.vnp_TmnCode) {
    throw new AppError("VNPay TMN Code is missing", 500);
  }
  if (!VNPAY_CONFIG.vnp_HashSecret) {
    throw new AppError("VNPay Hash Secret is missing", 500);
  }
  if (!VNPAY_CONFIG.vnp_Url) {
    throw new AppError("VNPay URL is missing", 500);
  }
  if (!VNPAY_CONFIG.vnp_AdminReturnUrl) {
    // Sửa từ vnp_Admin_ReturnUrl thành vnp_AdminReturnUrl
    throw new AppError("VNPay Admin Return URL is missing", 500);
  }

  // Tạo tham số VNPay
  const vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: VNPAY_CONFIG.vnp_TmnCode,
    vnp_Amount: (totalSalary * 100).toString(), // Nhân 100 theo chuẩn VNPay (VND -> đồng)
    vnp_CurrCode: "VND",
    vnp_TxnRef: payment._id.toString(),
    vnp_OrderInfo: `Thanh toan luong thang ${month}/${year} cho ${nutritionist.username}`,
    vnp_OrderType: "190000", // Dùng mã khác với meal plan (180000)
    vnp_Locale: "vn",
    vnp_ReturnUrl: VNPAY_CONFIG.vnp_AdminReturnUrl, // Sửa từ vnp_Admin_ReturnUrl thành vnp_AdminReturnUrl
    vnp_IpAddr: clientIp,
    vnp_CreateDate: moment().format("YYYYMMDDHHmmss"),
  };

  // Log tham số để debug
  console.log("VNPay params before sending:", vnp_Params);

  // Sắp xếp tham số và tạo secure hash
  const sortedParams = Object.fromEntries(
    Object.entries(vnp_Params)
      .map(([key, value]) => [key, String(value || "").trim()])
      .sort()
  );
  const signData = new URLSearchParams(sortedParams).toString();
  const secureHash = crypto
    .createHmac("sha512", VNPAY_CONFIG.vnp_HashSecret)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  sortedParams["vnp_SecureHash"] = secureHash;

  // Tạo URL thanh toán
  const paymentUrl = `${VNPAY_CONFIG.vnp_Url}?${new URLSearchParams(sortedParams).toString()}`;

  return { paymentUrl, paymentId: payment._id, calculatedSalary: totalSalary };
};

exports.vnpayAdminReturn = async (vnp_Params) => {
  const secureHash = vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  const sortedParams = Object.fromEntries(
    Object.entries(vnp_Params)
      .map(([key, value]) => [key, String(value || "").trim()])
      .sort()
  );
  const signData = new URLSearchParams(sortedParams).toString();
  const checkSum = crypto
    .createHmac("sha512", VNPAY_CONFIG.vnp_HashSecret)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  const baseUrl = process.env.ADMIN_WEB_URL || "http://localhost:3000";
  if (secureHash !== checkSum) {
    return `${baseUrl}/admin/financemanagement?status=error&message=Invalid+signature`;
  }

  const paymentId = vnp_Params["vnp_TxnRef"];
  const payment = await SalaryPayment.findById(paymentId);
  if (!payment) {
    return `${baseUrl}/admin/financemanagement?status=error&message=Payment+not+found`;
  }

  const responseCode = vnp_Params["vnp_ResponseCode"];
  const transactionNo = vnp_Params["vnp_TransactionNo"];

  if (responseCode === "00") {
    payment.status = "success";
    payment.paymentDate = new Date();
    payment.transactionNo = transactionNo;
    await payment.save();

    const nutritionist = await UserModel.findById(payment.userId);
    const mealPlans = await MealPlan.find({
      createdBy: payment.userId,
      startDate: {
        $gte: new Date(payment.year, payment.month - 1, 1),
        $lte: new Date(payment.year, payment.month, 0, 23, 59, 59, 999),
      },
    });

    const mealPlanIds = mealPlans.map((mp) => mp._id);
    const payments = await Payment.find({ mealPlanId: { $in: mealPlanIds }, status: "success" });

    const baseSalary = 5000000;
    const commission = payments.reduce((sum, payment) => {
      const mealPlan = mealPlans.find((mp) => mp._id.toString() === payment.mealPlanId.toString());
      return sum + (mealPlan ? mealPlan.price * 0.1 : 0);
    }, 0);
    const totalSalary = baseSalary + commission;

    const formattedSalary = totalSalary.toLocaleString("en-US") + " VND";
    const formattedCommission = commission.toLocaleString("en-US") + " VND";
    const formattedBaseSalary = baseSalary.toLocaleString("en-US") + " VND";

    const emailSubject = `Salary Notification for ${payment.month}/${payment.year} from Healthy Food`;
    const emailHtml = `
      <h2>Hello ${nutritionist.username},</h2>
      <p>We are pleased to inform you about your salary for ${payment.month}/${
      payment.year
    } as follows:</p>
      <ul>
        <li><strong>Base Salary:</strong> ${formattedBaseSalary}</li>
        <li><strong>Commission (10% of revenue):</strong> ${formattedCommission}</li>
        <li><strong>Total Salary:</strong> ${formattedSalary}</li>
      </ul>
      <p>The payment was successfully processed on ${new Date(
        payment.paymentDate
      ).toLocaleDateString("en-US")}.</p>
      <p>Transaction ID: ${payment.transactionNo}</p>
      <p>Thank you for your collaboration with Healthy Food!</p>
      <p>Best regards,<br/>The Healthy Food Team</p>
    `;

    await sendEmail({ email: nutritionist.email, subject: emailSubject, html: emailHtml });
    return `${baseUrl}/admin/financemanagement?status=success&message=Salary+payment+successful`;
  } else {
    payment.status = "failed";
    payment.transactionNo = transactionNo;
    await payment.save();
    return `${baseUrl}/admin/financemanagement?status=error&message=Salary+payment+failed`;
  }
};
