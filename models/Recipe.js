const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema({
  dishId: { type: mongoose.Schema.Types.ObjectId, ref: "Dish", required: true },
  ingredients: [
    {
      ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: "Ingredient", required: true },
      quantity: { type: Number, default: 1 },
      unit: { type: String, enum: ["g", "ml", "tbsp", "tp"], required: true },
    },
  ],
  instruction: [{ step: Number, description: String }],
  cookingTime: { type: Number }, // in minutes
  totalCalories: { type: Number },
  totalProtein: { type: Number },
  totalCarbs: { type: Number },
  totalFat: { type: Number },
  totalServing: { type: Number, default: 1 },
});

const Recipe = mongoose.model("Recipe", recipeSchema);
module.exports = Recipe;
