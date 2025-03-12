const mongoose = require("mongoose");

const userPreferenceSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Mỗi user chỉ có một preference
    },
    age: {
      type: Number,
      required: true,
    },
    diet: {
      type: String,
      default: null,
    },
    eatHabit: {
      type: [String],
      default: [],
    },
    favorite: {
      type: [String],
      default: [],
    },
    songOfPlan: {
      type: String,
      default: null,
    },
    mealNumber: {
      type: Number,
      default: 0,
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
    currentMealplanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MealPlan",
      default: null,
    },
    previousMealplanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MealPlan",
      default: null,
    },
    date: {
      type: [String],
      default: [],
    },
    recommendedFoods: {
      type: [String],
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
      enum: ["male", "female", "other"],
      required: true,
    },
    phoneNumber: {
      type: String,
      default: null,
    },
    underDisease: {
      type: String,
      default: null,
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
  { timestamps: true }
);

const UserPreference = mongoose.model("UserPreference", userPreferenceSchema);
module.exports = UserPreference;
