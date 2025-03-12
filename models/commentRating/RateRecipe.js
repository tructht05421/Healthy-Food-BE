const mongoose = require("mongoose");

const rateRecipeSchema = new mongoose.Schema(
  {
    recipeId: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    star: { type: Number, required: true, min: 1, max: 5 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RateRecipe", rateRecipeSchema);
