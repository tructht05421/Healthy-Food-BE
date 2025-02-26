const jwt = require("jsonwebtoken");
const AppError = require("../utils/appError");
const UserModel = require("../models/UserModel");
const catchAsync = require("../utils/catchAsync");
const isAuthenticated = catchAsync(async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return next(new AppError("You are not logged in. Please login to access", 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  const currentUser = await UserModel.findById(decoded.id);

  if (!currentUser) {
    return next(new AppError("The user belonging to this token does not exist", 401));
  }

  req.user = currentUser; // Make the user available in subsequent middleware/routes
  next(); // Call next to proceed to the next middleware/route
});
module.exports = isAuthenticated;
