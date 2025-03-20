const express = require("express");
const mealPlanRouter = express.Router();
const {
  createMealPlan,
  addMealToDay,
  addDishesToMeal,
  deleteDishFromMeal,
  getMealPlan,
  getMealDayByMealPlan,
  getMealById,
  getMealsByDayId,
  getDishesByMeal,
  updateMealPlan,
  toggleMealPlanStatus,
  deleteMealPlan,
  getUserMealPlan,
  getMealPlanById,
  removeMealFromDay,
} = require("../controllers/mealPlanController");
const { isAuthenticated } = require("../middlewares/isAuthenticated");
// Lấy danh sách MealPlan
mealPlanRouter.get("/", getMealPlan);
mealPlanRouter.get("/:mealPlanId", isAuthenticated, getMealPlanById);

mealPlanRouter.get("/user/:userId", isAuthenticated, getUserMealPlan);

// Tạo MealPlan
mealPlanRouter.post("/", createMealPlan);

// Cập nhật, bật/tắt trạng thái, hoặc xóa MealPlan
mealPlanRouter.put("/:mealPlanId", isAuthenticated, updateMealPlan);
mealPlanRouter.patch("/:mealPlanId/toggle", isAuthenticated, toggleMealPlanStatus);
mealPlanRouter.delete("/:mealPlanId", isAuthenticated, deleteMealPlan);

// Quản lý Meal trong MealDay
mealPlanRouter.post("/:mealPlanId/mealDay/:mealDayId/meal", isAuthenticated, addMealToDay);
mealPlanRouter.delete(
  "/:mealPlanId/mealDay/:mealDayId/meal/:mealId",
  isAuthenticated,
  removeMealFromDay
);

// Quản lý Dish trong Meal
mealPlanRouter.post(
  "/:mealPlanId/mealDay/:mealDayId/meal/:mealId/dishes",
  isAuthenticated,
  addDishesToMeal
);
mealPlanRouter.delete(
  "/:mealPlanId/mealDay/:mealDayId/meal/:mealId/dishes/:dishId",
  isAuthenticated,
  deleteDishFromMeal
);

// Lấy thông tin MealDay, Meal, và Dish
mealPlanRouter.get("/:mealPlanId/mealDay", isAuthenticated, getMealDayByMealPlan);
mealPlanRouter.get("/:mealPlanId/mealDay/:mealDayId/meal", isAuthenticated, getMealsByDayId);
mealPlanRouter.get("/:mealPlanId/mealDay/:mealDayId/meal/:mealId", isAuthenticated, getMealById);
mealPlanRouter.get(
  "/:mealPlanId/mealDay/:mealDayId/meal/:mealId/dishes",
  isAuthenticated,
  getDishesByMeal
);

// // Lấy danh sách MealPlan của user
// mealPlanRouter.get("/user/:user_id", getUserMealPlans);

// // Lấy chi tiết một MealPlan
// mealPlanRouter.get("/:id", getMealPlanById);

// // Cập nhật MealPlan
// mealPlanRouter.put("/:id", updateMealPlan);

// // Xóa MealPlan (soft delete)
// mealPlanRouter.delete("/:id", deleteMealPlan);

module.exports = mealPlanRouter;
