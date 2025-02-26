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
} = require("../controllers/authController");
const isAuthenticated = require("../middlewares/isAuthenticated");

const userRouter = express.Router();
userRouter.post("/signup", signup);
userRouter.post("/verify", verifyAccount);
userRouter.post("/resend-otp", resendOTP);
userRouter.post("/login", login);
userRouter.post("/login-google", googleLogin);
userRouter.post("/logout", logout);
userRouter.post("/forget-password", forgetPassword);
userRouter.post("/reset-password", resetPassword);

module.exports = userRouter;
