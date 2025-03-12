const express = require("express");
const mealPlanRouter = express.Router();
const {
  createMealPlan,
  addMealToDay,
  addDishesToMeal,
  deleteDishFromMeal,
  getMealPlan,
  getMealById,
  getMealsByDayId,
  getDishesByMeal,
  updateMealPlan,
  toggleMealPlanStatus,
  deleteMealPlan,
} = require("../controllers/mealPlanController");
const { isAuthenticated } = require("../middlewares/isAuthenticated");

// // Tạo MealPlan
mealPlanRouter.get("/", isAuthenticated, getMealPlan);
mealPlanRouter.post("/", createMealPlan);
mealPlanRouter.put("/:mealPlanId", isAuthenticated, updateMealPlan);
mealPlanRouter.put("/:mealPlanId", isAuthenticated, deleteMealPlan);
mealPlanRouter.patch("/:mealPlanId/toggle", isAuthenticated, toggleMealPlanStatus);
mealPlanRouter.delete("/:mealPlanId", isAuthenticated, deleteMealPlan);
mealPlanRouter.post("/:mealPlanId/mealDay/:mealDayId/meal", isAuthenticated, addMealToDay);
mealPlanRouter.post("/:mealPlanId/mealDay/:mealDayId/meal/:mealId/dishes", addDishesToMeal);
mealPlanRouter.delete(
  "/:mealPlanId/mealDay/:mealDayId/meal/:mealId/dishes/:dishId",
  deleteDishFromMeal
);
//  Lấy
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
