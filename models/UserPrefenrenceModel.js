const mongoose = require("mongoose");

const userPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    age: {
      type: String,
      default: null,
    },
    diet: {
      type: String,
      default: null,
    },
    eatHabit: {
      type: [String], // Mảng String
      default: [],
    },
    email: {
      type: String,
      required: [true, "Provide email"],
      lowercase: true,
    },
    favorite: {
      type: [String], // Mảng String
      default: [],
    },
    longOfPlan: {
      type: String,
      default: null,
    },
    mealNumber: {
      type: String,
      default: 0,
    },
    name: {
      type: String,
      required: [true, "Provide name"],
    },
    goal: {
      type: String,
      default: null,
    },
    sleepTime: {
      type: String,
      default: null,
    },
    waterDrink: {
      type: String,
      default: null,
    },
    hate: {
      type: [String], // Mảng String
      default: [],
    },
    weight: {
      type: Number,
      default: 0,
    },
    weightGoal: {
      type: Number,
      default: 0,
    },
    height: {
      type: Number,
      default: 0,
    },
    gender: {
      type: String,
      default: null,
    },
    phoneNumber: {
      type: String,
      default: null,
    },
    underDisease: {
      type: [String], // Chấp nhận nhiều giá trị
      default: [],
    },
    theme: {
      type: Boolean,
      default: false,
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
  }
);

const UserPreferenceModel = mongoose.model(
  "UserPreferenceModel",
  userPreferenceSchema
);
module.exports = UserPreferenceModel;
