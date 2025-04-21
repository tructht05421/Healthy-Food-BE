const express = require("express");
const ingredientRouter = express.Router();
const { isAuthenticated, isAdmin, isNutritionist } = require("../middlewares/isAuthenticated");

const {
  createIngredient,
  updateIngredient,
  getIngredientById,
  getAllIngredients,
  deleteIngredient,
  createManyIngredients,
  searchIngredientsByName,
  filterIngredientsByType,
} = require("../controllers/ingredientController");

ingredientRouter.post("/", isAuthenticated, isNutritionist, createIngredient); // Create a new ingredient
ingredientRouter.post("/manyIngredients", isAuthenticated, isNutritionist, createManyIngredients); // Create many ingredients
ingredientRouter.get("/", getAllIngredients); // Get all ingredients
ingredientRouter.get("/search", searchIngredientsByName); // Search by name
ingredientRouter.get("/filter", filterIngredientsByType); // Filter by type
ingredientRouter.get("/:ingredientId", getIngredientById); // Get ingredient by ID
ingredientRouter.put("/:ingredientId", isAuthenticated, isNutritionist, updateIngredient); // Update ingredient
ingredientRouter.delete("/:ingredientId", isAuthenticated, isNutritionist, deleteIngredient); // Delete ingredient

module.exports = ingredientRouter;
