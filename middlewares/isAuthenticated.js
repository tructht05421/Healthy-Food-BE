const jwt = require("jsonwebtoken");
const mongoose = require("mongoose"); // Import mongoose để sử dụng ObjectId
const AppError = require("../utils/appError");
const UserModel = require("../models/UserModel");
const catchAsync = require("../utils/catchAsync");

const isAuthenticated = catchAsync(async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return next(
      new AppError("You are not logged in. Please login to access", 401)
    );
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    console.log("✅ Decoded Token:", decoded); // Debug token
  } catch (error) {
    return next(new AppError("Invalid or expired token", 401));
  }

  // Kiểm tra `decoded.id` trước khi convert
  if (!decoded.id || typeof decoded.id !== "string") {
    return next(new AppError("Invalid token payload", 401));
  }

  let userId;
  try {
    userId = new mongoose.Types.ObjectId(decoded.id);
  } catch (error) {
    return next(new AppError("Invalid user ID format", 401));
  }

  // Tìm user trong database (Loại bỏ user đã xóa)
  const currentUser = await UserModel.findOne({ _id: userId, isDelete: false });

  console.log("🔍 User found in DB:", currentUser || "❌ Not Found"); // Debug user

  if (!currentUser) {
    return next(
      new AppError("The user belonging to this token does not exist", 401)
    );
  }

  req.user = currentUser; // Gán user vào request
  next();
});

// Middleware kiểm tra quyền admin
const isAdmin = (req, res, next) => {
  if (req.user?.role === "admin") {
    return next();
  }
  return next(
    new AppError("You do not have permission to perform this action", 403)
  );
};

// Middleware kiểm tra quyền nutritionist
const isNutritionist = (req, res, next) => {
  if (req.user?.role === "nutritionist") {
    return next();
  }
  return next(
    new AppError("You do not have permission to perform this action", 403)
  );
};

const protect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    console.log("Received token in middleware:", token); // Debug

    if (!token) {
      return next(
        new AppError("You are not logged in! Please log in to get access.", 401)
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    console.log("Decoded token:", decoded); // Debug

    const currentUser = await UserModel.findById(decoded.id);
    console.log("Found user:", currentUser ? currentUser._id : "No user found"); // Debug

    if (!currentUser) {
      return next(
        new AppError("The user belonging to this token no longer exists.", 401)
      );
    }

    req.user = currentUser;
    next();
  } catch (error) {
    console.error("Token verification error:", error.message); // Debug
    return next(new AppError("Invalid token. Please log in again!", 401));
  }
};

module.exports = { isAuthenticated, isAdmin, isNutritionist, protect };
