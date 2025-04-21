const express = require("express");
const {
  signup,
  verifyAccount,
  resendOTP,
  login,
  logout,
  forgetPassword,
  resetPassword,
  googleLogin,
  changePassword,
  requestOTP,
  verifyOtp,
  requestDeleteAccount,
  confirmDeleteAccount,
} = require("../controllers/authController");
const {
  updateUserById,
  searchUserByEmail,
  createUser,
  getAllUsers,
  getUserById,
  submitNutritionistApplication,
  getPendingNutritionists,
  reviewNutritionistApplication,
  deleteUser, // Add deleteUser to the imports
} = require("../controllers/userController");
const { isAuthenticated, isAdmin } = require("../middlewares/isAuthenticated");
const { protect } = require("../middlewares/isAuthenticated");

const userRouter = express.Router();

// Authentication routes (tĩnh, cụ thể)
userRouter.post("/signup", signup);
userRouter.post("/verify", verifyAccount);
userRouter.post("/resend-otp", resendOTP);
userRouter.post("/request-otp", requestOTP);
userRouter.post("/verify-otp", verifyOtp);
userRouter.post("/login", login);
userRouter.post("/login-google", googleLogin);
userRouter.post("/logout", logout);
userRouter.post("/forget-password", forgetPassword);
userRouter.post("/reset-password", resetPassword);
userRouter.post("/change-password", isAuthenticated, changePassword);
userRouter.post("/request-delete-account", requestDeleteAccount);
userRouter.post("/confirm-delete-account", confirmDeleteAccount);
// Nutritionist application routes (tĩnh, cụ thể)
userRouter.post("/submit-nutritionist", isAuthenticated, submitNutritionistApplication);
userRouter.post("/review-nutritionist", isAuthenticated, isAdmin, reviewNutritionistApplication);
userRouter.get("/pending-nutritionists", isAuthenticated, isAdmin, getPendingNutritionists);

// User management routes (tĩnh, cụ thể)
userRouter.post("/", createUser);
userRouter.get("/search", searchUserByEmail);

// User management routes (có tham số động)
userRouter.get("/:id", getUserById);
userRouter.put("/:id", updateUserById);
userRouter.delete("/:id", protect, deleteUser);

// Route chung (generic, đặt cuối cùng)
userRouter.get("/", getAllUsers);

module.exports = userRouter;
