const { OAuth2Client } = require("google-auth-library");
const generateOtp = require("../utils/generateOtp");
const AppError = require("../utils/appError");
const UserModel = require("../models/UserModel");
const sendEmail = require("../utils/email");
const jwt = require("jsonwebtoken");
const TempOTP = require("../models/TempOTP");

const client = new OAuth2Client(process.env.GG_CLIENT_ID);
console.log("CLIe", client);

const clientAndroid = new OAuth2Client(process.env.GG_CLIENT_ID_ANDROID);

// Hàm ký token
exports.signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Đăng ký
exports.signup = async (body) => {
  const { email, password, passwordConfirm, username } = body;

  // Check if email is already registered
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    return {
      success: false,
      error: new AppError("Email already registered", 400),
    };
  }

  // Create new user
  try {
    const newUser = await UserModel.create({
      email,
      password,
      passwordConfirm,
      username,
    });

    return {
      success: true,
      data: { user: newUser },
    };
  } catch (error) {
    return {
      success: false,
      error: new AppError("Error creating user. Please try again.", 500),
    };
  }
};

// Xác minh tài khoản
exports.verifyAccount = async (body) => {
  const { email, otp } = body;

  if (!email || !otp) {
    return {
      success: false,
      error: new AppError("Email and OTP are required", 400),
    };
  }

  // Tìm user bằng email
  const user = await UserModel.findOne({ email });

  if (!user) {
    return {
      success: false,
      error: new AppError("User not found", 404),
    };
  }

  // Kiểm tra thời hạn của OTP
  if (!user.otp || Date.now() > user.otpExpires) {
    return {
      success: false,
      error: new AppError("OTP has expired. Please request a new one", 400),
    };
  }

  // Kiểm tra OTP có đúng không
  if (user.otp !== otp) {
    return {
      success: false,
      error: new AppError("Invalid OTP", 400),
    };
  }

  // Nếu OTP hợp lệ, cập nhật trạng thái tài khoản
  user.otp = undefined;
  user.otpExpires = undefined;

  await user.save({ validateBeforeSave: false });

  return {
    success: true,
    data: { user },
  };
};

// Gửi lại OTP
exports.resendOTP = async (body) => {
  const { email } = body;

  if (!email) {
    return {
      success: false,
      error: new AppError("Email is required to resend OTP", 400),
    };
  }

  const user = await UserModel.findOne({ email });

  if (!user) {
    return {
      success: false,
      error: new AppError("User not found", 404),
    };
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

    return {
      success: true,
      status: "success",
      message: "A new OTP has been sent to your email successfully.",
    };
  } catch (error) {
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return {
      success: false,
      error: new AppError("There was an error sending the email. Please try again.", 500),
    };
  }
};

// Đăng kí tài khoản
exports.verifyOtp = async (body) => {
  const { email, otp } = body;

  if (!email || !otp) {
    return {
      success: false,
      error: new AppError("Email and OTP are required", 400),
    };
  }

  // Check OTP in TempOTP
  const tempOtp = await TempOTP.findOne({ email, otp });

  if (!tempOtp) {
    return {
      success: false,
      error: new AppError("Invalid OTP", 400),
    };
  }

  // Check expiration
  if (tempOtp.otpExpires < Date.now()) {
    await TempOTP.deleteOne({ email });
    return {
      success: false,
      error: new AppError("OTP has expired. Please request a new one.", 400),
    };
  }

  // OTP valid, delete from TempOTP
  await TempOTP.deleteOne({ email });
  return {
    success: true,
    status: "success",
    message: "OTP verified successfully.",
  };
};
exports.requestOTP = async (body) => {
  const { email } = body;

  if (!email) {
    return {
      success: false,
      error: new AppError("Email is required to send OTP", 400),
    };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      success: false,
      error: new AppError("Invalid email format", 400),
    };
  }

  // Check if email is already registered
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    return {
      success: false,
      error: new AppError("Email is already registered. Please use a different email.", 400),
    };
  }

  // Generate OTP and set expiration (shortened to 10 minutes)
  const newOtp = generateOtp();
  const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Delete any existing OTP for this email
  await TempOTP.deleteOne({ email });

  // Store OTP in TempOTP collection
  await TempOTP.create({
    email,
    otp: newOtp,
    otpExpires,
  });

  // Send OTP via email
  try {
    await sendEmail({
      email,
      subject: "OTP for Email Verification",
      html: `<h1>Your OTP is ${newOtp}</h1><p>This OTP is valid for 10 minutes.</p>`,
    });

    return {
      success: true,
      status: "success",
      message:
        "An OTP has been sent to your email. Please check your inbox (and spam/junk folder).",
    };
  } catch (error) {
    // Delete OTP if email sending fails
    await TempOTP.deleteOne({ email });
    return {
      success: false,
      error: new AppError("There was an error sending the email. Please try again.", 500),
    };
  }
};
// Đăng nhập
exports.login = async (body) => {
  const { email, password } = body;

  if (!email || !password) {
    return {
      success: false,
      error: new AppError("Please provide email and password", 400),
    };
  }

  const user = await UserModel.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return {
      success: false,
      error: new AppError("Incorrect Email or password", 401),
    };
  }

  return {
    success: true,
    data: { user },
  };
};

// Đăng nhập bằng Google
exports.googleLogin = async (body) => {
  try {
    const { idToken } = body;
    console.log("idToken:", idToken); // Thay logger.info bằng console.log

    // Kiểm tra idToken có tồn tại không
    if (!idToken) {
      return {
        success: false,
        error: new AppError("No Google token provided", 400),
      };
    }

    // Decode idToken để lấy giá trị aud (không cần xác thực)
    const decodedToken = jwt.decode(idToken);
    if (!decodedToken || !decodedToken.aud) {
      return {
        success: false,
        error: new AppError("Invalid idToken format", 400),
      };
    }

    const audience = decodedToken.aud;
    console.log("Audience from idToken:", audience); // Thay logger.info

    // Xác định client nào sẽ được dùng để xác thực token
    let selectedClient;
    let expectedAudience;

    if (audience === process.env.GG_CLIENT_ID) {
      selectedClient = client;
      expectedAudience = process.env.GG_CLIENT_ID;
      console.log("Using web client for verification"); // Thay logger.info
    } else if (audience === process.env.GG_CLIENT_ID_ANDROID) {
      selectedClient = clientAndroid;
      expectedAudience = process.env.GG_CLIENT_ID_ANDROID;
      console.log("Using Android client for verification"); // Thay logger.info
    } else {
      return {
        success: false,
        error: new AppError("Invalid audience in idToken", 400),
      };
    }

    // Xác thực token với Google
    const ticket = await selectedClient.verifyIdToken({
      idToken,
      audience: expectedAudience,
    });

    const { sub, email, name, picture } = ticket.getPayload();
    console.log("Token verified successfully:", { sub, email, name }); // Thay logger.info

    // Tìm người dùng trong DB
    let user = await UserModel.findOne({ email });

    if (!user) {
      // Nếu chưa có, tạo tài khoản mới
      user = await UserModel.create({
        username: name,
        email,
        avatarUrl: picture,
        googleId: sub,
      });
      console.log("New user created:", user); // Thay logger.info
    } else {
      console.log("User found:", user); // Thay logger.info
    }

    return {
      success: true,
      data: { user },
    };
  } catch (error) {
    console.error("Error in googleLogin:", error); // Thay logger.error
    return {
      success: false,
      error: new AppError(error.message || "Internal server error", 500),
    };
  }
};

// Quên mật khẩu
exports.forgetPassword = async (body) => {
  const { email } = body;

  const user = await UserModel.findOne({ email });

  if (!user) {
    return {
      success: false,
      error: new AppError("No user found with that email", 404),
    };
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

    return {
      success: true,
      status: "success",
      message: "Password reset OTP has been sent to your email.",
    };
  } catch (err) {
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return {
      success: false,
      error: new AppError("There was an error sending the email. Try again later!", 500),
    };
  }
};

// Đặt lại mật khẩu
exports.resetPassword = async (body) => {
  const { email, password, passwordConfirm } = body;

  const user = await UserModel.findOne({ email });

  if (!user) {
    return {
      success: false,
      error: new AppError("Invalid email or OTP expired", 400),
    };
  }

  // Cập nhật mật khẩu mới và đánh dấu là đã thay đổi
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.markModified("password"); // Đảm bảo middleware hash chạy

  // Xóa OTP sau khi sử dụng để tránh bị dùng lại
  user.otp = undefined;
  user.otpExpires = undefined;

  await user.save(); // Middleware sẽ tự hash mật khẩu

  return {
    success: true,
    data: { user },
  };
};

// Thay đổi mật khẩu
exports.changePassword = async (body, reqUser) => {
  const { currentPassword, newPassword, newPasswordConfirm } = body;

  // Kiểm tra các trường bắt buộc
  if (!currentPassword || !newPassword || !newPasswordConfirm) {
    return {
      success: false,
      error: new AppError("Please provide all required fields", 400),
    };
  }

  // Kiểm tra xác thực user
  if (!reqUser || !reqUser._id) {
    return {
      success: false,
      error: new AppError("Authentication required. Please log in.", 401),
    };
  }

  // Tìm user và lấy password đã băm
  const user = await UserModel.findById(reqUser._id).select("+password");
  if (!user) {
    return {
      success: false,
      error: new AppError("User not found", 404),
    };
  }

  // Kiểm tra mật khẩu hiện tại
  const isPasswordCorrect = await user.correctPassword(currentPassword, user.password);
  if (!isPasswordCorrect) {
    return {
      success: false,
      error: new AppError("Current password is incorrect", 400),
    };
  }

  // Kiểm tra mật khẩu mới và xác nhận có khớp không
  if (newPassword !== newPasswordConfirm) {
    return {
      success: false,
      error: new AppError("New password and confirmation do not match", 400),
    };
  }

  // Gán mật khẩu mới (middleware pre('save') sẽ tự động băm)
  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;

  // Lưu user và xử lý lỗi validation nếu có
  try {
    await user.save();
  } catch (error) {
    if (error.name === "ValidationError") {
      return {
        success: false,
        error: new AppError("New password does not meet requirements", 400),
      };
    }
    return {
      success: false,
      error: new AppError("Error saving new password", 500),
    };
  }

  return {
    success: true,
    data: { user },
  };
};

// Yêu cầu xóa tài khoản
exports.requestDeleteAccount = async (body) => {
  const { email } = body;

  if (!email) {
    return {
      success: false,
      error: new AppError("Email is required to delete account", 400),
    };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      success: false,
      error: new AppError("Invalid email format", 400),
    };
  }

  // Check if email exists
  const user = await UserModel.findOne({ email });
  if (!user) {
    return {
      success: false,
      error: new AppError("No user found with that email", 404),
    };
  }

  // Generate OTP and set expiration (10 minutes)
  const newOtp = generateOtp();
  const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Delete any existing OTP for this email
  await TempOTP.deleteOne({ email });

  // Store OTP in TempOTP collection
  await TempOTP.create({
    email,
    otp: newOtp,
    otpExpires,
  });

  // Send OTP via email
  try {
    await sendEmail({
      email,
      subject: "OTP for Account Deletion",
      html: `<h1>Your OTP for account deletion is ${newOtp}</h1><p>This OTP is valid for 10 minutes.</p>`,
    });

    return {
      success: true,
      status: "success",
      message: "An OTP has been sent to your email to confirm account deletion.",
    };
  } catch (error) {
    // Delete OTP if email sending fails
    await TempOTP.deleteOne({ email });
    return {
      success: false,
      error: new AppError("There was an error sending the email. Please try again.", 500),
    };
  }
};

// Xác nhận xóa tài khoản
exports.confirmDeleteAccount = async (body) => {
  const { email, otp } = body;

  if (!email || !otp) {
    return {
      success: false,
      error: new AppError("Email and OTP are required", 400),
    };
  }

  // Check OTP in TempOTP
  const tempOtp = await TempOTP.findOne({ email, otp });

  if (!tempOtp) {
    return {
      success: false,
      error: new AppError("Invalid OTP", 400),
    };
  }

  // Check expiration
  if (tempOtp.otpExpires < Date.now()) {
    await TempOTP.deleteOne({ email });
    return {
      success: false,
      error: new AppError("OTP has expired. Please request a new one.", 400),
    };
  }

  // Find user
  const user = await UserModel.findOne({ email });
  if (!user) {
    await TempOTP.deleteOne({ email });
    return {
      success: false,
      error: new AppError("User not found", 404),
    };
  }

  // Soft delete user by setting isDelete to true
  user.isDelete = true;
  await user.save({ validateBeforeSave: false });

  // Delete OTP
  await TempOTP.deleteOne({ email });

  return {
    success: true,
    status: "success",
    message: "Account deleted successfully.",
  };
};
