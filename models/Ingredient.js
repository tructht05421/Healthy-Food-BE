const mongoose = require("mongoose");

const ingredientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    image_url: {
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
    nutritional_info: {
      type: String,
    },
    type: {
      type: String,
    },
    season: {
      type: String,
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
