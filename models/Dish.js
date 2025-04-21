const mongoose = require("mongoose");

const dishSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: null,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    videoUrl: {
      type: String,
      default: null,
    },
    recipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      required: false,
    },
    medicalConditionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicalCondition", // Adjust the ref based on your model name
      required: false,
    },
    calories: {
      type: Number,
      default: 0,
    },
    protein: {
      type: Number,
      default: 0,
    },
    carbs: {
      type: Number,
      default: 0,
    },
    fat: {
      type: Number,
      default: 0,
    },
    totalServing: {
      type: Number,
      default: 0,
    },
    flavor: {
      type: [String], // Array of flavors
      default: [],
    },
    type: {
      type: String,
      required: true,
    },
    season: {
      type: String,
      default: null,
    },
    isVisible: {
      type: Boolean,
      default: true, // Assuming it defaults to visible
    },
    isDelete: {
      type: Boolean,
      default: false, // Not deleted by default
    },
  },
  {
    timestamps: true, // Keeps track of created_at and updated_at automatically
  }
);

const Dish = mongoose.model("Dish", dishSchema);
module.exports = Dish;
