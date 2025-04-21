const express = require("express");
const recipeRouter = express.Router();
const { isAuthenticated, isAdmin, isNutritionist } = require("../middlewares/isAuthenticated");
const {
  createRecipe,
  updateRecipeById,
  getRecipeById,
  deleteRecipeById,
  getAllRecipes,
  getRecipeByDishId,
} = require("../controllers/recipeController");

// Routes cho Recipe
recipeRouter.get("/", getAllRecipes);
recipeRouter.post("/:dishId", isAuthenticated, isNutritionist, createRecipe);
recipeRouter.get("/:dishId/:recipeId", getRecipeById);
recipeRouter.put("/:dishId/:recipeId", isAuthenticated, isNutritionist, updateRecipeById);
recipeRouter.delete("/:dishId/:recipeId", isAuthenticated, isNutritionist, deleteRecipeById);
recipeRouter.get("/dish/:recipeId", getRecipeByDishId); // Nếu cần lấy recipe theo dishId

module.exports = recipeRouter;
