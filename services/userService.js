const UserModel = require("../models/UserModel");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/email");
const bcrypt = require("bcryptjs");
// 📌 Lấy danh sách tất cả người dùng (bỏ qua user đã xóa)
exports.getAllUsers = async (query, currentAdminId) => {
  const page = parseInt(query.page) || 1; // Mặc định là trang 1
  const limit = parseInt(query.limit) || 10; // Mặc định 10 users mỗi trang
  const skip = (page - 1) * limit; // Tính số bản ghi cần bỏ qua

  // Điều kiện lọc: không bao gồm người dùng đã xóa, không phải admin đang đăng nhập, và không có role admin
  const filter = {
    isDelete: false,
    _id: { $ne: currentAdminId }, // Loại trừ admin đang đăng nhập
    role: { $ne: "admin" }, // Loại trừ người dùng có role admin
  };

  // Đếm tổng số người dùng thỏa mãn điều kiện
  const totalUsers = await UserModel.countDocuments(filter);

  // Lấy danh sách người dùng với phân trang
  const users = await UserModel.find(filter)
    .skip(skip)
    .limit(limit)
    .populate("userPreferenceId");

  // Tính tổng số trang
  const totalPages = Math.ceil(totalUsers / limit);

  return {
    status: "success",
    results: users.length,
    total: totalUsers,
    totalPages: totalPages,
    currentPage: page,
    data: { users },
  };
};

// 📌 Lấy thông tin chi tiết một người dùng theo ID (bỏ qua user đã xóa)
exports.getUserById = async (id) => {
  const user = await UserModel.findOne({
    _id: id,
    isDelete: false, // Chỉ lấy user chưa bị xóa
  }).populate("userPreferenceId");

  if (!user) {
    return {
      success: false,
      error: new AppError("User not found or has been deleted", 404),
    };
  }

  return {
    success: true,
    status: "success",
    data: { user },
  };
};

// 📌 Tìm kiếm người dùng theo email
exports.searchUserByEmail = async (query) => {
  const { email } = query;

  if (!email) {
    return {
      success: false,
      error: new AppError("Please provide an email to search", 400),
    };
  }

  const users = await UserModel.find({
    email: { $regex: email, $options: "i" }, // Tìm kiếm gần đúng, không phân biệt hoa/thường
    isDelete: false,
  })
    .select("_id username email avatarUrl role") // Thêm _id vào kết quả
    .limit(10); // Giới hạn 10 kết quả

  if (!users.length) {
    return {
      success: true,
      status: "success",
      results: 0,
      data: { users: [] },
    };
  }

  return {
    success: true,
    status: "success",
    results: users.length,
    data: { users },
  };
};

// 📌 Cập nhật người dùng theo ID
exports.updateUserById = async (id, updates) => {
  const user = await UserModel.findByIdAndUpdate(id, updates, {
    new: true, // Trả về user sau khi cập nhật
    runValidators: true, // Chạy validation trên dữ liệu cập nhật
  });

  if (!user || user.isDelete) {
    return {
      success: false,
      error: new AppError("User not found", 404),
    };
  }

  return {
    success: true,
    status: "success",
    message: "User updated successfully",
    data: { user },
  };
};

// 📌 Xóa người dùng (Soft Delete)
exports.deleteUser = async (id, password) => {
  // Tìm người dùng theo ID
  const user = await UserModel.findById(id).select("+password"); // Lấy trường password

  // Kiểm tra xem người dùng có tồn tại không
  if (!user || user.isDelete) {
    return {
      success: false,
      error: new AppError("User not found or has been deleted", 404),
    };
  }

  // Kiểm tra mật khẩu
  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    return {
      success: false,
      error: new AppError("Incorrect password", 401),
    };
  }

  // Thực hiện soft delete
  await UserModel.findByIdAndUpdate(id, { isDelete: true }, { new: true });

  return {
    success: true,
    status: "success",
    message: "User deleted successfully",
  };
};

// 📌 Khôi phục người dùng (Chỉ admin)
exports.restoreUser = async (id) => {
  const user = await UserModel.findByIdAndUpdate(
    id,
    { isDelete: false },
    { new: true }
  );

  if (!user) {
    return {
      success: false,
      error: new AppError("User not found", 404),
    };
  }

  return {
    success: true,
    status: "success",
    message: "User restored successfully",
    data: { user },
  };
};

// 📌 Tạo mới người dùng
exports.createUser = async (body) => {
  const { userName, email, phoneNumber, gender, status, role, profileImage } =
    body;

  // Kiểm tra xem user với email này đã tồn tại chưa
  const existingUser = await UserModel.findOne({ email, isDelete: false });
  if (existingUser) {
    return {
      success: false,
      error: new AppError("User with this email already exists", 409),
    };
  }

  // Tạo mật khẩu tạm (người dùng nên đổi sau khi đăng nhập lần đầu)
  const tempPassword = Math.random().toString(36).slice(-8);

  // Tạo user mới với tất cả các trường bắt buộc
  const newUser = await UserModel.create({
    userName,
    email,
    password: tempPassword, // Mật khẩu này nên được hash trong pre-save hook của UserModel
    phoneNumber: phoneNumber || "",
    gender: gender || "",
    status: status || "active", // Mặc định là active nếu không cung cấp
    role: role || "user", // Mặc định là user nếu không cung cấp
    profileImage: profileImage || "",
    isVerified: true, // Tài khoản do admin tạo, đánh dấu là đã xác minh
    isDelete: false, // Mặc định không bị xóa
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Xóa mật khẩu khỏi response
  const userResponse = newUser.toObject();
  delete userResponse.password;

  return {
    success: true,
    status: "success",
    message: "User created successfully",
    data: {
      user: userResponse,
      tempPassword, // Chỉ gửi trong response để admin chia sẻ với người dùng mới
    },
  };
};

// 📌 Nộp CV để trở thành Nutritionist
exports.submitNutritionistApplication = async (userId, body) => {
  const { personalInfo, profileImage, introduction } = body;

  // Kiểm tra xem user đã nộp đơn chưa
  const user = await UserModel.findById(userId);
  if (!user) {
    return {
      success: false,
      error: new AppError("User not found", 404),
    };
  }
  if (user.nutritionistApplication) {
    return {
      success: false,
      error: new AppError("You have already submitted an application", 400),
    };
  }

  // Cập nhật chỉ trường nutritionistApplication
  const updatedUser = await UserModel.updateOne(
    { _id: userId },
    {
      $set: {
        nutritionistApplication: {
          personalInfo,
          profileImage,
          introduction,
          status: "pending",
          submittedAt: new Date(),
        },
      },
    }
  );

  if (updatedUser.modifiedCount === 0) {
    return {
      success: false,
      error: new AppError("Failed to submit application", 500),
    };
  }

  // Lấy lại user để trả về response
  const updatedUserDoc = await UserModel.findById(userId);

  return {
    success: true,
    status: "success",
    message: "Application submitted successfully",
    data: { application: updatedUserDoc.nutritionistApplication },
  };
};

// 📌 Lấy danh sách user chờ phê duyệt Nutritionist
exports.getPendingNutritionists = async () => {
  const users = await UserModel.find({
    "nutritionistApplication.status": "pending",
    isDelete: false,
  });

  return {
    success: true,
    status: "success",
    results: users.length,
    data: { users },
  };
};

// 📌 Phê duyệt hoặc từ chối Nutritionist
exports.reviewNutritionistApplication = async (body) => {
  const { userId, action } = body;

  const user = await UserModel.findById(userId);
  if (!user || !user.nutritionistApplication) {
    return {
      success: false,
      error: new AppError("User or application not found", 404),
    };
  }

  if (user.nutritionistApplication.status !== "pending") {
    return {
      success: false,
      error: new AppError("Application has already been reviewed", 400),
    };
  }

  let emailSubject, emailHtml;

  if (action === "approve") {
    user.nutritionistApplication.status = "approved";
    user.role = "nutritionist";
    emailSubject =
      "Chúc mừng! Đơn xin trở thành Nutritionist của bạn đã được phê duyệt";
    emailHtml = `
      <h2>Chúc mừng ${user.username}!</h2>
      <p>Chúng tôi rất vui mừng thông báo rằng đơn xin trở thành Nutritionist của bạn đã được phê duyệt.</p>
      <p>Bạn giờ đây có thể bắt đầu hoạt động với vai trò Nutritionist trên hệ thống Healthy Food.</p>
      <p>Trân trọng,<br/>Đội ngũ Healthy Food</p>
    `;
  } else if (action === "reject") {
    emailSubject = "Thông báo về đơn xin trở thành Nutritionist";
    emailHtml = `
      <h2>Xin chào ${user.username},</h2>
      <p>Chúng tôi rất tiếc phải thông báo rằng đơn xin trở thành Nutritionist của bạn đã bị từ chối.</p>
      <p>Bạn có thể nộp lại đơn đăng ký nếu muốn. Vui lòng kiểm tra và bổ sung thông tin cần thiết trước khi nộp lại.</p>
      <p>Trân trọng,<br/>Đội ngũ Healthy Food</p>
    `;
    user.nutritionistApplication = null;
  } else {
    return {
      success: false,
      error: new AppError("Invalid action", 400),
    };
  }

  await user.save();

  // Gửi email thông báo
  try {
    await sendEmail({
      email: user.email,
      subject: emailSubject,
      html: emailHtml,
    });
    console.log(`Email sent to ${user.email} for ${action} action`);
    return {
      success: true,
      status: "success",
      message: `Application ${action}d successfully`,
      data: { user },
    };
  } catch (emailError) {
    console.error(`Failed to send email to ${user.email}:`, emailError);
    return {
      success: true,
      status: "success",
      message: `Application ${action}d successfully, but email notification failed`,
      data: { user },
      emailError: emailError.message,
    };
  }
};
