const mongoose = require("mongoose");

const ingredientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
    },
    description: {
      type: String,
    },
    calories: {
      type: Number,
    },
    protein: {
      type: Number,
    },
    carbs: {
      type: Number,
    },
    fat: {
      type: Number,
    },
    unit: {
      type: String,
      enum: ["ml", "g", "tbsp", "tsp"], // Allowed units
      required: true,
    },
    nutritionalInfo: {
      type: String,
    },
    type: {
      type: String,
    },
    season: {
      type: String,
    },
    isVisible: {
      type: Boolean,
      default: true, // Assuming it defaults to visible
    },
    isDelete: {
      type: Boolean,
      default: false, // Default value
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

const Ingredient = mongoose.model("Ingredient", ingredientSchema);
module.exports = Ingredient;
