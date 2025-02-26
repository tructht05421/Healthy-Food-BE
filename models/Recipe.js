const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema(
  {
    dish_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dish",
      required: true,
    },
    ingredients: [
      {
        ingredient_id: { type: mongoose.Schema.Types.ObjectId, ref: "Ingredient" },
        quantity: { type: Number },
        unit: { type: String }, // Đơn vị đo lường
      },
    ],
    total_servings: { type: Number }, // Tổng số phần ăn
  },
  {
    timestamps: true,
  }
);

const Recipe = mongoose.model("Recipe", recipeSchema);
module.exports = Recipe;
