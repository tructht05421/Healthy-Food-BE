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
      type: [String],
      default: [],
    },
    email: {
      type: String,
      required: [true, "Provide email"],
      lowercase: true,
    },
    favorite: {
      type: [String],
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
    activityLevel: {
      type: String,
      default: null,
    },
    waterDrink: {
      type: String,
      default: null,
    },
    hate: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ingredient" }],
      required: false,
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
    activityLevel: {
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
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "MedicalCondition" }],
      required: false,
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
    timestamps: true,
  }
);

const UserPreferenceModel = mongoose.model(
  "UserPreferenceModel",
  userPreferenceSchema
);
module.exports = UserPreferenceModel;
