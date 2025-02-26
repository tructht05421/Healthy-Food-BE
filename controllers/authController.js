const { OAuth2Client } = require("google-auth-library");
const generateOtp = require("../utils/generateOtp");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const UserModel = require("../models/UserModel");
const sendEmail = require("../utils/email");
const jwt = require("jsonwebtoken");

const client = new OAuth2Client(process.env.GG_CLIENT_ID);
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res, message) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "Lax",
  };

  res.cookie("token", token, cookieOptions);

  // Xóa dữ liệu nhạy cảm trước khi gửi về client
  user.password = undefined;
  user.passwordConfirm = undefined;
  user.otp = undefined;
  user.otpExpires = undefined;

  res.status(statusCode).json({
    status: "success",
    message,
    token,
    data: {
      user, // Sử dụng trực tiếp user thay vì biến không tồn tại
    },
  });
};
// SignUp
exports.signup = catchAsync(async (req, res, next) => {
  const { email, password, passwordConfirm, username } = req.body;

  // Kiểm tra xem email đã được đăng ký chưa
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) return next(new AppError("Email already registered", 400));

  // Tạo OTP và thời gian hết hạn
  const otp = generateOtp();
  const otpExpires = Date.now() + 24 * 60 * 60 * 1000; // Thời gian hết hạn là 24 giờ
  // Tạo người dùng mới
  const newUser = await UserModel.create({
    email,
    password,
    passwordConfirm,
    username,
    otp, // OTP
    otpExpires, // Thời gian hết hạn OTP
  });

  // Gửi OTP qua email
  try {
    await sendEmail({
      email: newUser.email,
      subject: "OTP for email verification",
      html: `<h1>Your OTP is ${otp}</h1>`,
    });

    console.log("Email sent successfully");
    await createSendToken(newUser, 200, res, "Registration successful");
  } catch (error) {
    console.error(" Error sending email:", error);

    // Xóa user nếu có lỗi gửi email
    await UserModel.findByIdAndDelete(newUser._id);

    return next(new AppError("There is an error sending the email. Try again", 500));
  }
});

// Verify Account
exports.verifyAccount = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(new AppError("Email and OTP are required", 400));
  }

  // 1. Tìm user bằng email
  const user = await UserModel.findOne({ email });

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // 2. Kiểm tra thời hạn của OTP
  if (!user.otp || Date.now() > user.otpExpires) {
    return next(new AppError("OTP has expired. Please request a new one", 400));
  }

  // 3. Kiểm tra OTP có đúng không
  if (user.otp !== otp) {
    return next(new AppError("Invalid OTP", 400));
  }

  // 4. Nếu OTP hợp lệ, cập nhật trạng thái tài khoản
  user.otp = undefined; // Xóa OTP để tránh bị dùng lại
  user.otpExpires = undefined; // Xóa thời gian hết hạn OTP

  await user.save({ validateBeforeSave: false }); // Lưu thay đổi vào database

  createSendToken(user, 200, res, "Email has been verified successfully!"); // Gửi token và thông báo thành công
});

// Resend OTP
exports.resendOTP = catchAsync(async (req, res, next) => {
  const { email } = req.body; // Nhận email từ body, không cần auth

  if (!email) {
    return next(new AppError("Email is required to resend OTP", 400));
  }

  const user = await UserModel.findOne({ email });

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Tạo OTP mới
  const newOtp = generateOtp();
  const otpExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 giờ

  // Cập nhật user với OTP mới và thời gian hết hạn
  user.otp = newOtp;
  user.otpExpires = otpExpires;
  await user.save({ validateBeforeSave: false });

  // Gửi OTP qua email
  try {
    await sendEmail({
      email: user.email,
      subject: "Resend OTP for email verification",
      html: `<h1>Your new OTP is ${newOtp}</h1>`,
    });

    res.status(200).json({
      status: "success",
      message: "A new OTP has been sent to your email successfully.",
    });
  } catch (error) {
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError("There was an error sending the email. Please try again.", 500));
  }
});

// Login
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  const user = await UserModel.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect Email or password", 401));
  }

  createSendToken(user, 200, res, "Login Successful");
});
// Google Login
exports.googleLogin = catchAsync(async (req, res, next) => {
  const { idToken } = req.body;
  if (!idToken) {
    return next(new AppError("No Google token provided", 400));
  }

  // Xác thực token với Google
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GG_CLIENT_ID,
  });

  const { sub, email, name, picture } = ticket.getPayload(); // `sub` là Google ID

  // Tìm người dùng trong DB
  let user = await UserModel.findOne({ email });

  if (!user) {
    // Nếu chưa có, tạo tài khoản mới (kèm googleId)
    user = await UserModel.create({
      username: name,
      email,
      avatar_url: picture,
      googleId: sub, // Lưu Google ID để tránh yêu cầu password
    });
  }

  // Tạo token & gửi response
  createSendToken(user, 200, res, "Google Login Successful");
});

// Logout
exports.logout = catchAsync(async (req, res, next) => {
  res.cookie("token", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000), // Thời gian sống của cookie là 10 giây
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "Lax", // SameSite để bảo mật cookie
  });

  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
});
// Forget Password
exports.forgetPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body; // Lấy email từ request body

  const user = await UserModel.findOne({ email });

  if (!user) {
    return next(new AppError("No user found with that email", 404));
  }

  // Tạo OTP mới
  const otp = generateOtp();
  user.otp = otp;
  user.otpExpires = Date.now() + 300000; // 5 phút hết hạn

  await user.save({ validateBeforeSave: false });

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 5 min)",
      html: `
      <p>Forgot your password? Submit a PATCH request with your new password and passwordConfirm to:</p> 
      <p>Your OTP is <b>${user.otp}</b></p>        
      <p>If you didn't forget your password, please ignore this email!</p>
      `,
    });

    res.status(200).json({
      status: "success",
      message: "Password reset OTP has been sent to your email.",
    });
  } catch (err) {
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError("There was an error sending the email. Try again later!", 500));
  }
});
// Reset Password
exports.resetPassword = catchAsync(async (req, res, next) => {
  const { email, password, passwordConfirm } = req.body;

  const user = await UserModel.findOne({
    email,
  });

  if (!user) {
    return next(new AppError("Invalid email or OTP expired", 400));
  }

  // Cập nhật mật khẩu mới và đánh dấu là đã thay đổi
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.markModified("password"); // Đảm bảo middleware hash chạy

  // Xóa OTP sau khi sử dụng để tránh bị dùng lại
  user.otp = undefined;
  user.otpExpires = undefined;

  await user.save(); // Middleware sẽ tự hash mật khẩu

  createSendToken(user, 200, res, "Password reset successfully!");
});
