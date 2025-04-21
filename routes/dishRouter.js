const express = require("express");
const dishRouter = express.Router();
const { isAuthenticated, isAdmin, isNutritionist } = require("../middlewares/isAuthenticated");
const {
  createDish,
  updateDish,
  getDishById,
  getAllDishes,
  getAllDishesForNutri,
  deleteDish,

  createManyDishes,
  hideDish,
  getDishesBySeason,
  searchDishByName,
  getDishByType,
} = require("../controllers/dishController");

// Routes cho Dish
dishRouter.get("/", getAllDishes);
dishRouter.get("/search", searchDishByName);
dishRouter.get("/type/:type", getDishByType);
// In dishRouter.js
dishRouter.get("/by-season", getDishesBySeason);
dishRouter.get("/nutritionist", getAllDishesForNutri);

dishRouter.post("/", isAuthenticated, isNutritionist, createDish);
dishRouter.post("/multiple", isAuthenticated, isNutritionist, createManyDishes);
dishRouter.put("/:dishId", isAuthenticated, isNutritionist, updateDish);
dishRouter.delete("/:dishId", isAuthenticated, isNutritionist, deleteDish);
dishRouter.get("/:dishId", getDishById);

dishRouter.patch("/:dishId/hide", isAuthenticated, isNutritionist, hideDish); // Nếu có hideDish

module.exports = dishRouter;
