const express = require("express");
const ingredientRouter = express.Router();
const {
  createIngredient,
  updateIngredient,
  getIngredientById,
  getAllIngredients,
  deleteIngredient,
  createManyIngredients,
  searchIngredientsByName,
  filterIngredientsByType,
} = require("../controllers/dishController");

ingredientRouter.post("/", createIngredient); // Create a new ingredient
ingredientRouter.post("/manyIngredients", createManyIngredients); // Create many ingredients
ingredientRouter.get("/", getAllIngredients); // Get all ingredients
ingredientRouter.get("/search", searchIngredientsByName); // Search by name
ingredientRouter.get("/filter", filterIngredientsByType); // Filter by type
ingredientRouter.get("/:ingredientId", getIngredientById); // Get ingredient by ID
ingredientRouter.put("/:ingredientId", updateIngredient); // Update ingredient
ingredientRouter.delete("/:ingredientId", deleteIngredient); // Delete ingredient

module.exports = ingredientRouter;
