const authService = require("../services/authService");
const catchAsync = require("../utils/catchAsync");

// Hàm tạo và gửi token
const createSendToken = (user, statusCode, res, message) => {
  const token = authService.signToken(user._id);

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
    data: { user },
  });
};

// Đăng ký
exports.signup = catchAsync(async (req, res, next) => {
  const result = await authService.signup(req.body);
  if (!result.success) {
    return next(result.error); // Trả về lỗi 400 hoặc 500 nếu có vấn đề
  }
  createSendToken(result.data.user, 200, res, "Registration successful");
});

// Xác minh tài khoản
exports.verifyAccount = catchAsync(async (req, res, next) => {
  const result = await authService.verifyAccount(req.body);
  if (!result.success) {
    return next(result.error); // Trả về lỗi 400 hoặc 404 nếu có vấn đề
  }
  createSendToken(result.data.user, 200, res, "Email has been verified successfully!");
});

// Gửi lại OTP
exports.resendOTP = catchAsync(async (req, res, next) => {
  const result = await authService.resendOTP(req.body);
  if (!result.success) {
    return next(result.error); // Trả về lỗi 400 hoặc 500 nếu có vấn đề
  }
  res.status(200).json(result);
});
// Xác minh OTP (cho TempOTP)
exports.verifyOtp = catchAsync(async (req, res, next) => {
  const result = await authService.verifyOtp(req.body);
  if (!result.success) {
    return next(result.error);
  }
  res.status(200).json(result);
});
// Gửi OTP ban đầu
exports.requestOTP = catchAsync(async (req, res, next) => {
  const result = await authService.requestOTP(req.body);
  if (!result.success) {
    return next(result.error);
  }
  res.status(200).json(result);
});
// Yêu cầu xóa tài khoản
exports.requestDeleteAccount = catchAsync(async (req, res, next) => {
  const result = await authService.requestDeleteAccount(req.body);
  if (!result.success) {
    return next(result.error); // Trả về lỗi 400, 404 hoặc 500 nếu có vấn đề
  }
  res.status(200).json(result);
});

// Xác nhận xóa tài khoản
exports.confirmDeleteAccount = catchAsync(async (req, res, next) => {
  const result = await authService.confirmDeleteAccount(req.body);
  if (!result.success) {
    return next(result.error); // Trả về lỗi 400 hoặc 404 nếu có vấn đề
  }
  res.status(200).json(result);
});

// Đăng nhập
exports.login = catchAsync(async (req, res, next) => {
  const result = await authService.login(req.body);
  if (!result.success) {
    return next(result.error); // Trả về lỗi 400 hoặc 401 nếu có vấn đề
  }
  createSendToken(result.data.user, 200, res, "Login Successful");
});

// Đăng nhập bằng Google
exports.googleLogin = catchAsync(async (req, res, next) => {
  const result = await authService.googleLogin(req.body);
  if (!result.success) {
    return next(result.error); // Trả về lỗi 400 nếu có vấn đề
  }
  createSendToken(result.data.user, 200, res, "Google Login Successful");
});

// Đăng xuất
exports.logout = catchAsync(async (req, res, next) => {
  res.cookie("token", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000), // Thời gian sống của cookie là 10 giây
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "Lax",
  });

  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
});

// Quên mật khẩu
exports.forgetPassword = catchAsync(async (req, res, next) => {
  const result = await authService.forgetPassword(req.body);
  if (!result.success) {
    return next(result.error); // Trả về lỗi 404 hoặc 500 nếu có vấn đề
  }
  res.status(200).json(result);
});

// Đặt lại mật khẩu
exports.resetPassword = catchAsync(async (req, res, next) => {
  const result = await authService.resetPassword(req.body);
  if (!result.success) {
    return next(result.error); // Trả về lỗi 400 nếu có vấn đề
  }
  createSendToken(result.data.user, 200, res, "Password reset successfully!");
});

// Thay đổi mật khẩu
exports.changePassword = catchAsync(async (req, res, next) => {
  const result = await authService.changePassword(req.body, req.user);
  if (!result.success) {
    return next(result.error); // Trả về lỗi 400, 401 hoặc 404 nếu có vấn đề
  }
  createSendToken(result.data.user, 200, res, "Password changed successfully!");
});

// Giới hạn quyền truy cập
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to perform this action", 403));
    }
    next();
  };
};
