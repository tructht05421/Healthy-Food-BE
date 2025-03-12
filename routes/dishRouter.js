const express = require("express");
const dishRouter = express.Router();
const { isAuthenticated, isAdmin, isNutritionist } = require("../middlewares/isAuthenticated");

const {
  createDish,
  updateDish,
  getDishById,
  getAllDishes,
  deleteDish,
  getDishByType,
  createRecipe,
  updateRecipeById,
  getRecipeById,
  deleteRecipeById,
  getAllRecipes,
} = require("../controllers/dishController");

dishRouter.get("/", getAllDishes); 

// Chỉ admin/nutritionist mới có thể thêm, cập nhật, xóa món ăn
dishRouter.post("/", isAuthenticated, isNutritionist, createDish);
dishRouter.put("/:dishId", isAuthenticated, isNutritionist, updateDish);
dishRouter.delete("/:dishId", isAuthenticated, isNutritionist, deleteDish);

// Lấy thông tin món ăn
dishRouter.get("/:dishId", getDishById);
dishRouter.get("/type/:type", getDishByType);

// Routes liên quan đến công thức món ăn
dishRouter.get("/", getAllRecipes); // Lấy tất cả món ăn (lọc theo role)

dishRouter.post("/:dishId/recipes", isAuthenticated, isNutritionist, createRecipe);
dishRouter.get("/:dishId/recipes/:recipeId", getRecipeById);
dishRouter.put("/:dishId/recipes/:recipeId", isAuthenticated, isNutritionist, updateRecipeById);
dishRouter.delete("/:dishId/recipes/:recipeId", isAuthenticated, isNutritionist, deleteRecipeById);

module.exports = dishRouter;
