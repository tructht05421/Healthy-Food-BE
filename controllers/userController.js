const userService = require("../services/userService");
const catchAsync = require("../utils/catchAsync");

// 📌 Lấy danh sách tất cả người dùng (bỏ qua user đã xóa)
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const result = await userService.getAllUsers(req.query, req.user?._id);
  res.status(200).json(result);
});

// 📌 Lấy thông tin chi tiết một người dùng theo ID (bỏ qua user đã xóa)
exports.getUserById = catchAsync(async (req, res, next) => {
  const result = await userService.getUserById(req.params.id);
  if (!result.success) {
    return next(result.error); // Trả về lỗi 404 nếu không tìm thấy
  }
  res.status(200).json(result);
});

// 📌 Tìm kiếm người dùng theo email
exports.searchUserByEmail = catchAsync(async (req, res, next) => {
  const result = await userService.searchUserByEmail(req.query);
  if (!result.success) {
    return next(result.error); // Trả về lỗi 400 nếu thiếu email
  }
  res.status(200).json(result);
});

// 📌 Cập nhật người dùng theo ID
exports.updateUserById = catchAsync(async (req, res, next) => {
  const result = await userService.updateUserById(req.params.id, req.body);
  if (!result.success) {
    return next(result.error); // Trả về lỗi 404 nếu không tìm thấy
  }
  res.status(200).json(result);
});

// 📌 Xóa người dùng (Soft Delete)
exports.deleteUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { password } = req.body; // Lấy mật khẩu từ body

  if (!password) {
    return next(new AppError("Password is required", 400));
  }

  const result = await userService.deleteUser(id, password);
  if (!result.success) {
    return next(result.error); // Trả về lỗi 404 hoặc 401 nếu không tìm thấy hoặc mật khẩu sai
  }

  res.status(200).json(result);
});

// 📌 Khôi phục người dùng (Chỉ admin)
exports.restoreUser = catchAsync(async (req, res, next) => {
  const result = await userService.restoreUser(req.params.id);
  if (!result.success) {
    return next(result.error); // Trả về lỗi 404 nếu không tìm thấy
  }
  res.status(200).json(result);
});

// 📌 Tạo mới người dùng
exports.createUser = catchAsync(async (req, res, next) => {
  const result = await userService.createUser(req.body);
  if (!result.success) {
    return next(result.error); // Trả về lỗi 409 nếu email đã tồn tại
  }
  res.status(201).json(result);
});

// 📌 Nộp CV để trở thành Nutritionist
exports.submitNutritionistApplication = catchAsync(async (req, res, next) => {
  if (!req.user || !req.user._id) {
    return next(new AppError("Unauthorized: No user found in request", 401));
  }
  const result = await userService.submitNutritionistApplication(
    req.user._id,
    req.body
  );
  if (!result.success) {
    return next(result.error); // Trả về lỗi 400 hoặc 404 nếu có vấn đề
  }
  res.status(200).json(result);
});

// 📌 Lấy danh sách user chờ phê duyệt Nutritionist
exports.getPendingNutritionists = catchAsync(async (req, res, next) => {
  const result = await userService.getPendingNutritionists();
  res.status(200).json(result);
});

// 📌 Phê duyệt hoặc từ chối Nutritionist
exports.reviewNutritionistApplication = catchAsync(async (req, res, next) => {
  const result = await userService.reviewNutritionistApplication(req.body);
  if (!result.success) {
    return next(result.error); // Trả về lỗi 400 hoặc 404 nếu có vấn đề
  }
  res.status(200).json(result);
});
