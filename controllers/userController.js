const UserModel = require("../models/UserModel");
// Import UserPreference model
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const mongoose = require("mongoose");

// 📌 Lấy danh sách tất cả người dùng (bỏ qua user đã xóa)
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await UserModel.find({ isDelete: false }).populate(
    "userPreferenceId"
  );

  res.status(200).json({
    status: "success",
    results: users.length,
    data: { users },
  });
});

// 📌 Lấy thông tin chi tiết một người dùng theo ID (bỏ qua user đã xóa)
exports.getUserById = catchAsync(async (req, res, next) => {
  const user = await UserModel.findOne({
    _id: req.params.id,
    isDelete: false, // Chỉ lấy user chưa bị xóa
  }).populate("userPreferenceId");

  if (!user) {
    return next(new AppError("User not found or has been deleted", 404));
  }

  res.status(200).json({
    status: "success",
    data: { user },
  });
});

// Update User By ID
exports.updateUserById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const updates = req.body;

  const user = await UserModel.findByIdAndUpdate(id, updates, {
    new: true, // Trả về user sau khi cập nhật
    runValidators: true, // Chạy validation trên dữ liệu cập nhật
  });

  if (!user || user.isDelete) return next(new AppError("User not found", 404));

  res.status(200).json({
    status: "success",
    message: "User updated successfully",
    data: { user },
  });
});







// 📌 Xóa người dùng (Soft Delete) - chỉ xóa nếu user chưa bị xóa trước đó
exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await UserModel.findByIdAndUpdate(
    
    req.params.id,
   
    { isDelete: true },
   
    { new: true }
  
  );

  if (!user) {
    return next(new AppError("User not found or has been deleted", 404));
  }

  res.status(200).json({
    status: "success",
    message: "User deleted successfully",
  });
});

// 🟢 Restore user (Chỉ admin)
exports.restoreUser = catchAsync(async (req, res, next) => {
  const user = await UserModel.findByIdAndUpdate(
    
    req.params.id,
   
    { isDelete: false },
   
    { new: true }
  
  );

  if (!user) return next(new AppError("User not found", 404));

  res.status(200).json({
    status: "success",
    message: "User restored successfully",
    data: { user },
  });
});
