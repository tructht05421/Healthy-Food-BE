const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Provide name"],
      trim: true,
      minlength: 3,
      maxlength: 30,
      index: true,
    },
    email: {
      type: String,
      required: [true, "Provide email"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId; // Nếu không có googleId thì yêu cầu password
      },
      minlength: 6,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: function () {
        return !this.googleId && this.isModified("password");
      },
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: "Passwords are not the same",
      },
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Cho phép giá trị null
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpires: {
      type: Date,
      default: null,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["admin", "user", "nutritionist"],
      default: "user",
    },
    userPreferenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserPreferenceModel",
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    isBan: {
      type: Boolean,
      default: false,
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    nutritionistApplication: {
      type: {
        personalInfo: {
          fullName: { type: String },
          phoneNumber: { type: String },
          address: { type: String },
        },
        profileImage: { type: String },
        introduction: { type: String },
        certificateLink: {
          // Thêm trường mới
          type: String,
          default: null,
          validate: {
            validator: function (v) {
              // Kiểm tra định dạng URL hợp lệ nếu có giá trị
              return v ? validator.isURL(v) : true;
            },
            message: "Please provide a valid URL for the certificate link",
          },
        },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        submittedAt: {
          type: Date,
          default: Date.now,
        },
      },
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// 🔐 Hash password trước khi lưu vào database (chỉ khi user có password)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined; // Không lưu vào database
  next();
});

// 🚫 Kiểm tra chỉ cho phép 1 admin
userSchema.pre("save", async function (next) {
  if (this.role !== "admin" || this.isModified("role") === false) return next();

  const adminCount = await mongoose
    .model("User")
    .countDocuments({ role: "admin" });
  if (adminCount >= 1 && this.isNew) {
    return next(new Error("Hệ thống chỉ cho phép 1 tài khoản admin"));
  }
  next();
});

// ✅ Kiểm tra password khi đăng nhập thường
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const UserModel = mongoose.model("User", userSchema);
module.exports = UserModel;
